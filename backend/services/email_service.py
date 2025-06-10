import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
from dotenv import load_dotenv
import logging
from fastapi import HTTPException

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USER = os.getenv('SMTP_USER')
SMTP_PASS = os.getenv('SMTP_PASS')

# Log configuration
logger.info(f"SMTP Configuration - Host: {SMTP_HOST}, Port: {SMTP_PORT}, User: {SMTP_USER}")

def send_email(to_email, subject, body_html, body_text=None):
    if not SMTP_USER or not SMTP_PASS:
        error_msg = "SMTP credentials not configured"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

    msg = MIMEMultipart('alternative')
    msg['From'] = SMTP_USER
    msg['To'] = to_email
    msg['Subject'] = subject

    if body_text:
        msg.attach(MIMEText(body_text, 'plain'))
    msg.attach(MIMEText(body_html, 'html'))

    try:
        logger.info(f"Attempting to connect to SMTP server: {SMTP_HOST}:{SMTP_PORT}")
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            logger.info("Starting TLS connection")
            server.starttls()
            
            logger.info(f"Attempting to login with user: {SMTP_USER}")
            server.login(SMTP_USER, SMTP_PASS)
            
            logger.info(f"Sending email to: {to_email}")
            server.sendmail(SMTP_USER, to_email, msg.as_string())
            logger.info("Email sent successfully")
        return True
    except smtplib.SMTPAuthenticationError as e:
        error_msg = f"SMTP Authentication Error: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
    except smtplib.SMTPException as e:
        error_msg = f"SMTP Error: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        error_msg = f"Unexpected error sending email: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
