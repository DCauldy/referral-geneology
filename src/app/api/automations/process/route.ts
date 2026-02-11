import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend/client";
import {
  interpolateTemplate,
  buildContactVariables,
  getFromAddress,
} from "@/lib/resend/config";

const BATCH_SIZE = 100;

function getDelayMs(amount: number, unit: string): number {
  switch (unit) {
    case "minutes":
      return amount * 60 * 1000;
    case "hours":
      return amount * 60 * 60 * 1000;
    case "days":
      return amount * 24 * 60 * 60 * 1000;
    case "weeks":
      return amount * 7 * 24 * 60 * 60 * 1000;
    default:
      return amount * 24 * 60 * 60 * 1000;
  }
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  let processed = 0;
  let errors = 0;

  try {
    // Fetch enrollments ready for processing
    const { data: enrollments, error: fetchError } = await supabase
      .from("automation_enrollments")
      .select("*")
      .eq("status", "active")
      .lte("next_action_at", new Date().toISOString())
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error("Cron: failed to fetch enrollments", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch enrollments" },
        { status: 500 }
      );
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ processed: 0, errors: 0 });
    }

    for (const enrollment of enrollments) {
      try {
        // Get automation and its steps
        const { data: automation } = await supabase
          .from("automations")
          .select("*, org:organizations(id, name)")
          .eq("id", enrollment.automation_id)
          .single();

        if (!automation || automation.status !== "active") {
          // Automation was deactivated, skip
          continue;
        }

        const { data: allSteps } = await supabase
          .from("automation_steps")
          .select("*, template:email_templates(*)")
          .eq("automation_id", enrollment.automation_id)
          .order("step_order", { ascending: true });

        if (!allSteps || allSteps.length === 0) {
          // No steps, mark completed
          await supabase
            .from("automation_enrollments")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", enrollment.id);
          processed++;
          continue;
        }

        // Find next step
        const nextStep = allSteps.find(
          (s) => s.step_order > enrollment.current_step_order
        );

        if (!nextStep) {
          // All steps completed
          await supabase
            .from("automation_enrollments")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", enrollment.id);
          processed++;
          continue;
        }

        if (nextStep.step_type === "delay") {
          // Advance past the delay step and set next_action_at
          const delayMs = getDelayMs(
            nextStep.delay_amount || 1,
            nextStep.delay_unit || "days"
          );
          const nextActionAt = new Date(Date.now() + delayMs).toISOString();

          await supabase
            .from("automation_enrollments")
            .update({
              current_step_order: nextStep.step_order,
              next_action_at: nextActionAt,
            })
            .eq("id", enrollment.id);

          processed++;
          continue;
        }

        if (nextStep.step_type === "email") {
          // Fetch contact
          const { data: contact } = await supabase
            .from("contacts")
            .select("*, company:companies(id, name)")
            .eq("id", enrollment.contact_id)
            .single();

          if (!contact || !contact.email) {
            await supabase
              .from("automation_enrollments")
              .update({
                status: "failed",
                error_message: contact
                  ? "Contact has no email"
                  : "Contact not found",
              })
              .eq("id", enrollment.id);
            errors++;
            continue;
          }

          const template = nextStep.template;
          if (!template) {
            await supabase
              .from("automation_enrollments")
              .update({
                status: "failed",
                error_message: "Email step has no template",
              })
              .eq("id", enrollment.id);
            errors++;
            continue;
          }

          // Build and send email
          const variables = buildContactVariables(contact);
          const html = interpolateTemplate(template.html_content, variables);
          const text = template.text_content
            ? interpolateTemplate(template.text_content, variables)
            : undefined;
          const subject = interpolateTemplate(
            nextStep.subject_override || template.subject,
            variables
          );

          const orgData = automation.org as { id: string; name: string } | null;

          const { id: resendId } = await sendEmail({
            to: contact.email,
            from: getFromAddress(orgData?.name),
            subject,
            html,
            text,
          });

          // Log the email
          await supabase.from("email_logs").insert({
            org_id: automation.org_id,
            enrollment_id: enrollment.id,
            automation_id: enrollment.automation_id,
            step_id: nextStep.id,
            template_id: nextStep.template_id,
            contact_id: enrollment.contact_id,
            resend_id: resendId,
            to_email: contact.email,
            subject,
            status: "sent",
          });

          // Update automation stats
          const stats = (automation.stats as Record<string, number>) || {};
          await supabase
            .from("automations")
            .update({
              stats: { ...stats, sent: (stats.sent || 0) + 1 },
            })
            .eq("id", automation.id);

          // Advance enrollment
          await supabase
            .from("automation_enrollments")
            .update({
              current_step_order: nextStep.step_order,
              next_action_at: new Date().toISOString(),
            })
            .eq("id", enrollment.id);

          processed++;
        }
      } catch (err) {
        console.error(
          `Cron: error processing enrollment ${enrollment.id}`,
          err
        );

        // Mark as failed
        await supabase
          .from("automation_enrollments")
          .update({
            status: "failed",
            error_message:
              err instanceof Error ? err.message : "Unknown error",
          })
          .eq("id", enrollment.id);

        errors++;
      }
    }

    return NextResponse.json({ processed, errors });
  } catch (err) {
    console.error("Cron engine error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
