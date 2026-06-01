"""
Servicio de recuperación de contraseña con JWT y envío de correo
Maneja generación de tokens JWT, validación y envío de correos para reseteo de contraseña
"""

import os
import smtplib
import jwt
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_PASSWORD = os.getenv("GMAIL_PASSWORD")
JWT_SECRET = os.getenv("JWT_SECRET", "default-secret-key")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRY_HOURS = 1
FRONTEND_URL = "http://localhost:5173"  # Cambiar a URL de producción

def generate_reset_token(user_id: int, email: str) -> str:
    """
    Genera un token JWT para reseteo de contraseña
    
    Args:
        user_id: ID del usuario
        email: Email del usuario
    
    Returns:
        Token JWT
    """
    payload = {
        "user_id": user_id,
        "email": email,
        "purpose": "password_reset",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=TOKEN_EXPIRY_HOURS)
    }
    
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token

def validate_reset_token(token: str) -> dict:
    """
    Valida un token JWT y extrae los datos
    
    Args:
        token: Token JWT a validar
    
    Returns:
        Diccionario con datos del token si es válido
    
    Raises:
        jwt.InvalidTokenError: Si el token es inválido o ha expirado
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if payload.get("purpose") != "password_reset":
            raise jwt.InvalidTokenError("Token purpose mismatch")
        
        return payload
    except jwt.ExpiredSignatureError:
        raise jwt.InvalidTokenError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise jwt.InvalidTokenError(f"Invalid token: {str(e)}")

def send_reset_email(email: str, username: str, reset_token: str) -> bool:
    """
    Envía un correo de recuperación de contraseña
    
    Args:
        email: Email del destinatario
        username: Nombre de usuario
        reset_token: Token JWT para reseteo
    
    Returns:
        True si se envió correctamente, False si hubo error
    """
    if not GMAIL_USER or not GMAIL_PASSWORD:
        print("⚠ Credenciales de correo no configuradas. Modo desarrollador activado.")
        print(f"[DEV] Reset link for {email}: {FRONTEND_URL}/reset-password?token={reset_token}")
        return False
    
    try:
        # Crear enlace de reseteo
        reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
        
        # Preparar mensaje
        subject = "Restablecer contraseña - SheepBooru"
        body = f"""
        <html>
            <body>
                <h2>Restablecer Contraseña</h2>
                <p>Hola {username},</p>
                <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el enlace a continuación:</p>
                <p><a href="{reset_link}" style="background-color: #1e6ed8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Restablecer Contraseña</a></p>
                <p>Si no solicitaste esto, ignora este correo.</p>
                <p>El enlace expira en {TOKEN_EXPIRY_HOURS} hora(s).</p>
                <hr>
                <small>SheepBooru - Sistema de Gestión de Contenido</small>
            </body>
        </html>
        """
        
        # Crear mensaje MIME
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = GMAIL_USER
        message["To"] = email
        
        # Adjuntar versión HTML
        html_part = MIMEText(body, "html")
        message.attach(html_part)
        
        # Enviar correo
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_PASSWORD)
            server.send_message(message)
        
        print(f"✓ Correo de reseteo enviado a {email}")
        return True
        
    except smtplib.SMTPAuthenticationError:
        print(f"✗ Error de autenticación SMTP. Verifica GMAIL_USER y GMAIL_PASSWORD en .env")
        return False
    except smtplib.SMTPException as e:
        print(f"✗ Error SMTP: {str(e)}")
        return False
    except Exception as e:
        print(f"✗ Error enviando correo: {str(e)}")
        return False
