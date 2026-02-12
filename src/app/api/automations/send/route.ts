import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend/client";
import {
  interpolateTemplate,
  buildContactVariables,
  getFromAddress,
} from "@/lib/resend/config";
import { isImpersonating } from "@/lib/admin/impersonation";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contact_id, template_id, automation_id, step_id, enrollment_id } =
      body;

    if (!contact_id || !template_id) {
      return NextResponse.json(
        { error: "contact_id and template_id are required" },
        { status: 400 }
      );
    }

    // Fetch contact with company
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("*, company:companies(id, name)")
      .eq("id", contact_id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    if (!contact.email) {
      return NextResponse.json(
        { error: "Contact has no email address" },
        { status: 400 }
      );
    }

    // Block email sending during impersonation
    if (await isImpersonating(supabase, user.id, contact.org_id)) {
      return NextResponse.json(
        { error: "Cannot send emails while impersonating an organization" },
        { status: 403 }
      );
    }

    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("id", template_id)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Fetch org for from address
    const { data: org } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", contact.org_id)
      .single();

    // Build variables and interpolate
    const variables = buildContactVariables(contact);
    const html = interpolateTemplate(template.html_content, variables);
    const text = template.text_content
      ? interpolateTemplate(template.text_content, variables)
      : undefined;
    const subject = interpolateTemplate(
      body.subject_override || template.subject,
      variables
    );

    // Send via Resend
    const { id: resendId } = await sendEmail({
      to: contact.email,
      from: getFromAddress(org?.name),
      subject,
      html,
      text,
    });

    // Create email log
    await supabase.from("email_logs").insert({
      org_id: contact.org_id,
      enrollment_id: enrollment_id || null,
      automation_id: automation_id || null,
      step_id: step_id || null,
      template_id,
      contact_id,
      resend_id: resendId,
      to_email: contact.email,
      subject,
      status: "sent",
    });

    // Create activity record
    await supabase.from("activities").insert({
      org_id: contact.org_id,
      entity_type: "contact",
      entity_id: contact_id,
      activity_type: "email",
      title: `Email sent: ${subject}`,
      description: `Automated email sent using template "${template.name}"`,
      metadata: {
        template_id,
        automation_id: automation_id || null,
        resend_id: resendId,
      },
      created_by: user.id,
    });

    return NextResponse.json({ success: true, resend_id: resendId });
  } catch (err) {
    console.error("Send email error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
