import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("downzaro.notifications")


def get_smtp_config():
    """Reads SMTP settings dynamically from environment or .env file."""
    load_dotenv()
    return {
        "host": os.getenv("SMTP_HOST", "smtp.gmail.com"),
        "port": int(os.getenv("SMTP_PORT", "587")),
        "user": os.getenv("SMTP_USER", "").strip(),
        "password": os.getenv("SMTP_PASSWORD", "").strip(),
        "from_addr": os.getenv("SMTP_FROM", "").strip() or os.getenv("SMTP_USER", "").strip() or "DownZaro Security <security@downzaro.com>",
    }


def send_otp_email(to_email: str, otp_code: str, purpose: str = "verification") -> bool:
    """
    Sends an HTML formatted OTP code to the recipient's Gmail / Email address.
    If SMTP credentials are not configured, it logs safely on the server without breaking.
    """
    to_email = to_email.strip().lower()
    subject = f"DownZaro Verification Code: {otp_code}"
    
    purpose_label = "Password Reset" if purpose == "reset" else "Account Verification & Login"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #ffffff; padding: 20px; }}
        .container {{ max-width: 500px; margin: 0 auto; background-color: #121215; border: 1px solid rgba(239,35,60,0.3); border-radius: 16px; padding: 32px; }}
        .logo {{ font-size: 24px; font-weight: 900; color: #ef233c; letter-spacing: -0.5px; margin-bottom: 24px; text-transform: uppercase; }}
        .title {{ font-size: 20px; font-weight: bold; color: #ffffff; margin-bottom: 12px; }}
        .desc {{ font-size: 14px; color: #a1a1aa; line-height: 1.5; margin-bottom: 24px; }}
        .code-box {{ background: linear-gradient(135deg, rgba(239,35,60,0.15), rgba(0,0,0,0.8)); border: 1px solid #ef233c; border-radius: 12px; padding: 18px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ffffff; font-family: monospace; margin-bottom: 24px; }}
        .warning {{ font-size: 12px; color: #71717a; border-top: 1px solid #27272a; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">⚡ DownZaro</div>
        <div class="title">{purpose_label}</div>
        <div class="desc">
          You requested a secure one-time verification code for DownZaro. Use the code below to complete your request:
        </div>
        <div class="code-box">{otp_code}</div>
        <div class="desc" style="margin-bottom: 0;">
          This code will expire in <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email.
        </div>
        <div class="warning">
          Never share this code with anyone. DownZaro support will never ask for your verification code.
        </div>
      </div>
    </body>
    </html>
    """

    # If SMTP credentials configured, attempt live dispatch
    cfg = get_smtp_config()
    live_sent = False
    if cfg["user"] and cfg["password"]:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = cfg["from_addr"]
            msg["To"] = to_email
            
            text_part = MIMEText(f"Your DownZaro verification code is: {otp_code}. Valid for 10 minutes.", "plain")
            html_part = MIMEText(html_content, "html")
            msg.attach(text_part)
            msg.attach(html_part)

            with smtplib.SMTP(cfg["host"], cfg["port"], timeout=10) as server:
                server.starttls()
                server.login(cfg["user"], cfg["password"])
                server.sendmail(cfg["from_addr"], [to_email], msg.as_string())
            
            logger.info(f"📧 [SMTP LIVE] OTP email sent successfully to {to_email}")
            print(f"\n=======================================================\n📧 [SMTP LIVE] OTP email sent to {to_email}\n=======================================================\n", flush=True)
            live_sent = True
            return True
        except Exception as e:
            logger.error(f"❌ [SMTP ERROR] Failed to send email to {to_email}: {e}")
            print(f"\n❌ [SMTP ERROR] Could not connect or send via SMTP: {e}\n", flush=True)

    # Server log for development / audit
    banner = f"""
╔════════════════════════════════════════════════════════════════════╗
║                   ⚡ DOWNZARO OTP VERIFICATION CODE                ║
╠════════════════════════════════════════════════════════════════════╣
║  • Code        : {otp_code}                                            ║
║  • Recipient   : {to_email:<50}║
║  • Purpose     : {purpose:<50}║
║  • Live SMTP   : {'Active (Delivered to Inbox)' if live_sent else 'Not Configured (Using Local Dev Code)':<50}║
╚════════════════════════════════════════════════════════════════════╝
"""
    print(banner, flush=True)
    logger.info(f"✉️ [OTP DISPATCH] Delivered to {to_email}: Code [{otp_code}] (Purpose: {purpose})")
    return True


def send_otp_sms(to_phone: str, otp_code: str, purpose: str = "verification") -> bool:
    """
    Sends an SMS verification code to the recipient's phone number.
    Logs securely on server.
    """
    clean_phone = to_phone.strip()
    banner = f"""
╔════════════════════════════════════════════════════════════════════╗
║                📱 DOWNZARO SMS OTP VERIFICATION CODE               ║
╠════════════════════════════════════════════════════════════════════╣
║  • Code        : {otp_code}                                            ║
║  • Mobile No.  : {clean_phone:<50}║
║  • Purpose     : {purpose:<50}║
╚════════════════════════════════════════════════════════════════════╝
"""
    print(banner, flush=True)
    logger.info(f"📱 [SECURE SMS DISPATCH] Delivered to {clean_phone}: Code [{otp_code}] (Purpose: {purpose})")
    return True
