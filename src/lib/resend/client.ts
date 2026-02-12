import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export async function sendEmail(params: {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}) {
  const { data, error } = await getResend().emails.send({
    from: params.from || process.env.RESEND_FROM_EMAIL!,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
    replyTo: params.replyTo,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { id: data?.id };
}

export async function sendBatchEmails(
  emails: {
    to: string;
    from?: string;
    subject: string;
    html: string;
    text?: string;
  }[]
) {
  const { data, error } = await getResend().batch.send(
    emails.map((e) => ({
      from: e.from || process.env.RESEND_FROM_EMAIL!,
      to: e.to,
      subject: e.subject,
      html: e.html,
      text: e.text,
    }))
  );

  if (error) {
    throw new Error(error.message);
  }

  return { ids: data?.data?.map((d) => d.id) ?? [] };
}
