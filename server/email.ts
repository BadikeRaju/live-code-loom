import nodemailer from "nodemailer";

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailArgs): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });

    try {
      const info = await transporter.sendMail({
        from: `"CoFlux" <${user}>`,
        to,
        subject,
        text,
        html
      });
      console.log("Email sent successfully:", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending real email via SMTP:", error);
      return false;
    }
  } else {
    console.log("-----------------------------------------");
    console.log("SMTP configuration not set in .env. Logging email details:");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML Body:\n${html}`);
    console.log("-----------------------------------------");
    return true;
  }
}
