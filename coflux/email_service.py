import smtplib
from email.message import EmailMessage
from django.conf import settings


def send_email(to_email: str, subject: str, body: str):
    if not all([settings.SMTP_HOST, settings.SMTP_PORT, settings.SMTP_USER, settings.SMTP_PASS]):
        print(f"--- EMAIL (Mock) ---\nTo: {to_email}\nSubject: {subject}\n{body}\n--------------------")
        return

    msg = EmailMessage()
    msg.set_content(body)
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_USER
    msg["To"] = to_email

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.send_message(msg)
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
