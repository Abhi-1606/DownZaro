import os
import hashlib
import secrets
import random
from datetime import datetime, timedelta
import logging
from app.db.database import get_pg_connection, get_sqlite_connection

logger = logging.getLogger("downzaro.auth")

SESSION_DURATION_DAYS = 30
OTP_VALID_MINUTES = 10


from app.services.notification_service import send_otp_email, send_otp_sms


def hash_password(password: str, salt: str = None) -> tuple[str, str]:
    if not salt:
        salt = secrets.token_hex(16)
    # Salted PBKDF2 HMAC SHA-256 with 100,000 iterations
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return dk.hex(), salt


def verify_password(password: str, stored_hash: str, salt: str) -> bool:
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return secrets.compare_digest(dk.hex(), stored_hash)


def execute_query(query: str, params: tuple = (), fetch_one: bool = False, fetch_all: bool = False, commit: bool = False):
    """Executes a query against PostgreSQL in Docker with SQLite fallback."""
    pg_conn = get_pg_connection()
    if pg_conn:
        try:
            with pg_conn.cursor() as cur:
                cur.execute(query, params)
                if commit:
                    pg_conn.commit()
                if fetch_one:
                    row = cur.fetchone()
                    if row is None:
                        return None
                    col_names = [desc[0] for desc in cur.description]
                    return dict(zip(col_names, row))
                if fetch_all:
                    rows = cur.fetchall()
                    col_names = [desc[0] for desc in cur.description]
                    return [dict(zip(col_names, r)) for r in rows]
                return None
        finally:
            pg_conn.close()

    # SQLite fallback
    sq_conn = get_sqlite_connection()
    try:
        # Translate PostgreSQL parameter placeholders (%s to ?)
        sqlite_query = query.replace('%s', '?')
        cur = sq_conn.cursor()
        cur.execute(sqlite_query, params)
        if commit:
            sq_conn.commit()
        if fetch_one:
            row = cur.fetchone()
            return dict(row) if row else None
        if fetch_all:
            rows = cur.fetchall()
            return [dict(r) for r in rows]
        return None
    finally:
        sq_conn.close()


def find_user_by_identifier(identifier: str):
    """Find user by Email, Username, or Phone Number in Credentials-DownZaro."""
    if not identifier:
        return None
    clean_id = identifier.strip()
    query = '''
        SELECT * FROM "Credentials-DownZaro" 
        WHERE LOWER(email) = LOWER(%s) 
           OR LOWER(username) = LOWER(%s) 
           OR phone = %s
        LIMIT 1
    '''
    return execute_query(query, (clean_id, clean_id, clean_id), fetch_one=True)


def find_user_by_id(user_id: int):
    query = 'SELECT * FROM "Credentials-DownZaro" WHERE id = %s LIMIT 1'
    return execute_query(query, (user_id,), fetch_one=True)


def register_user(name: str, email: str, username: str, password: str, phone: str = None):
    """Creates a new user in Credentials-DownZaro."""
    name = name.strip()
    email = email.strip().lower()
    username = username.strip().lower()
    phone = phone.strip() if phone else None

    # Check for existing email
    existing_email = execute_query('SELECT id FROM "Credentials-DownZaro" WHERE LOWER(email) = %s', (email,), fetch_one=True)
    if existing_email:
        raise ValueError("An account with this email address already exists. Please sign in instead.")

    # Check for existing username
    existing_username = execute_query('SELECT id FROM "Credentials-DownZaro" WHERE LOWER(username) = %s', (username,), fetch_one=True)
    if existing_username:
        raise ValueError("This username is already taken. Please choose another username.")

    pwd_hash, salt = hash_password(password)

    insert_query = '''
        INSERT INTO "Credentials-DownZaro" (name, username, email, phone, password_hash, salt, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, name, username, email, phone, created_at
    '''
    pg_conn = get_pg_connection()
    if pg_conn:
        try:
            with pg_conn.cursor() as cur:
                cur.execute(insert_query, (name, username, email, phone, pwd_hash, salt))
                row = cur.fetchone()
                col_names = [desc[0] for desc in cur.description]
                return dict(zip(col_names, row))
        finally:
            pg_conn.close()

    # SQLite fallback
    sq_conn = get_sqlite_connection()
    try:
        cur = sq_conn.cursor()
        cur.execute(
            'INSERT INTO "Credentials-DownZaro" (name, username, email, phone, password_hash, salt) VALUES (?, ?, ?, ?, ?, ?)',
            (name, username, email, phone, pwd_hash, salt)
        )
        user_id = cur.lastrowid
        sq_conn.commit()
        return find_user_by_id(user_id)
    finally:
        sq_conn.close()


def authenticate_google_user(email: str, name: str = None, mode: str = "signin"):
    """
    Handles Google Account sign in / sign up with strict existence checks.
    - If mode == 'signup' and user exists -> error
    - If mode == 'signin' and user does not exist -> error
    """
    email_clean = email.strip().lower()
    existing = execute_query('SELECT * FROM "Credentials-DownZaro" WHERE LOWER(email) = %s LIMIT 1', (email_clean,), fetch_one=True)

    if mode == "signup":
        if existing:
            raise ValueError("An account with this Google email already exists. Please sign in instead.")
        
        display_name = name.strip() if name and name.strip() else email_clean.split('@')[0].capitalize()
        base_username = email_clean.split('@')[0].lower()
        unique_username = base_username
        counter = 1
        while execute_query('SELECT id FROM "Credentials-DownZaro" WHERE LOWER(username) = %s', (unique_username,), fetch_one=True):
            unique_username = f"{base_username}{counter}"
            counter += 1

        default_password = secrets.token_urlsafe(16)
        new_user = register_user(
            name=display_name,
            email=email_clean,
            username=unique_username,
            password=default_password
        )
        new_user["is_new"] = True
        return new_user
    else:
        # Sign In
        if not existing:
            raise ValueError("No account found with this Google email. Please sign up first to create an account.")
        return existing


def get_or_create_device_user(email: str, name: str = None, username: str = None):
    """Retrieves existing user or creates a new user instantly for device account login."""
    email_clean = email.strip().lower()
    existing = execute_query('SELECT * FROM "Credentials-DownZaro" WHERE LOWER(email) = %s LIMIT 1', (email_clean,), fetch_one=True)
    if existing:
        return existing

    # Create account if new
    display_name = name.strip() if name and name.strip() else email_clean.split('@')[0].capitalize()
    base_username = (username.strip().lower() if username and username.strip() else email_clean.split('@')[0].lower())
    unique_username = base_username
    counter = 1
    while execute_query('SELECT id FROM "Credentials-DownZaro" WHERE LOWER(username) = %s', (unique_username,), fetch_one=True):
        unique_username = f"{base_username}{counter}"
        counter += 1

    default_password = secrets.token_urlsafe(16)
    new_user = register_user(
        name=display_name,
        email=email_clean,
        username=unique_username,
        password=default_password
    )
    new_user["is_new"] = True
    return new_user


def authenticate_user(identifier: str, password: str) -> tuple[dict | None, str | None]:
    """Authenticates user via Email, Username, or Phone + Password with explicit error reasons."""
    user = find_user_by_identifier(identifier)
    if not user:
        return None, "ACCOUNT_NOT_FOUND"
    if not verify_password(password, user["password_hash"], user["salt"]):
        return None, "INVALID_PASSWORD"
    return user, None


def create_session(user_id: int) -> str:
    token = secrets.token_urlsafe(48)
    expires_at = datetime.utcnow() + timedelta(days=SESSION_DURATION_DAYS)
    query = 'INSERT INTO "sessions" (token, user_id, expires_at) VALUES (%s, %s, %s)'
    execute_query(query, (token, user_id, expires_at), commit=True)
    return token


def get_user_from_token(token: str):
    query = '''
        SELECT u.id, u.name, u.username, u.email, u.phone, u.created_at
        FROM "sessions" s
        JOIN "Credentials-DownZaro" u ON s.user_id = u.id
        WHERE s.token = %s AND s.expires_at > CURRENT_TIMESTAMP
        LIMIT 1
    '''
    return execute_query(query, (token,), fetch_one=True)


def delete_session(token: str):
    execute_query('DELETE FROM "sessions" WHERE token = %s', (token,), commit=True)


def mask_email(email: str) -> str:
    if not email or "@" not in email:
        return email or ""
    parts = email.split("@")
    name = parts[0]
    domain = parts[1]
    masked_name = name[:2] + "***" if len(name) > 2 else name + "***"
    return f"{masked_name}@{domain}"


def mask_phone(phone: str) -> str:
    if not phone:
        return ""
    clean = phone.strip()
    if len(clean) > 4:
        return clean[:2] + "******" + clean[-4:]
    return clean


def get_user_otp_channels(identifier: str, require_existing: bool = True):
    """Retrieves available OTP delivery channels (Email vs Phone) for a user."""
    user = find_user_by_identifier(identifier)
    if not user:
        if require_existing:
            raise ValueError("No account found with this email, username, or mobile number. Please sign up first.")
        # If identifier itself is an email or phone for fresh signup
        if "@" in identifier:
            return {
                "found": False,
                "email": identifier.strip().lower(),
                "masked_email": mask_email(identifier),
                "has_email": True,
                "phone": None,
                "masked_phone": None,
                "has_phone": False,
                "name": None
            }
        else:
            return {
                "found": False,
                "email": None,
                "masked_email": None,
                "has_email": False,
                "phone": identifier.strip(),
                "masked_phone": mask_phone(identifier),
                "has_phone": True,
                "name": None
            }

    return {
        "found": True,
        "name": user["name"],
        "username": user["username"],
        "email": user["email"],
        "masked_email": mask_email(user["email"]),
        "has_email": bool(user.get("email")),
        "phone": user.get("phone"),
        "masked_phone": mask_phone(user.get("phone")) if user.get("phone") else None,
        "has_phone": bool(user.get("phone"))
    }


def create_otp(destination: str, purpose: str = "login", channel: str = "email") -> str:
    """Generates a 6-digit OTP code, records it, and dispatches it via real email or SMS."""
    destination = destination.strip().lower()
    code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_VALID_MINUTES)
    
    query = 'INSERT INTO "otps" (destination, code, purpose, expires_at, verified) VALUES (%s, %s, %s, %s, %s)'
    execute_query(query, (destination, code, purpose, expires_at, False), commit=True)
    
    # Dispatch via actual email or SMS
    if channel == "phone" or ("@" not in destination and not channel == "email"):
        send_otp_sms(destination, code, purpose)
    else:
        send_otp_email(destination, code, purpose)

    return code


def verify_otp(destination: str, code: str, purpose: str = "login") -> bool:
    destination = destination.strip().lower()
    code = code.strip()
    query = '''
        SELECT id FROM "otps"
        WHERE LOWER(destination) = LOWER(%s)
          AND code = %s
          AND purpose = %s
          AND expires_at > CURRENT_TIMESTAMP
          AND verified = %s
        ORDER BY id DESC
        LIMIT 1
    '''
    record = execute_query(query, (destination, code, purpose, False), fetch_one=True)
    if record:
        execute_query('UPDATE "otps" SET verified = %s WHERE id = %s', (True, record["id"]), commit=True)
        return True
    return False


def register_passkey(user_id: int, credential_id: str, public_key: str):
    query = '''
        UPDATE "Credentials-DownZaro"
        SET passkey_credential_id = %s, passkey_public_key = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
    '''
    execute_query(query, (credential_id, public_key, user_id), commit=True)


def update_user_profile(user_id: int, name: str = None, email: str = None, phone: str = None, new_password: str = None):
    """Updates user information in Credentials-DownZaro."""
    user = find_user_by_id(user_id)
    if not user:
        raise ValueError("User not found.")

    updates = []
    params = []

    if name:
        updates.append("name = %s")
        params.append(name.strip())
    if email:
        email_clean = email.strip().lower()
        if email_clean != user["email"].lower():
            existing = execute_query('SELECT id FROM "Credentials-DownZaro" WHERE LOWER(email) = %s AND id != %s', (email_clean, user_id), fetch_one=True)
            if existing:
                raise ValueError("This email is already in use by another account.")
            updates.append("email = %s")
            params.append(email_clean)
    if phone is not None:
        updates.append("phone = %s")
        params.append(phone.strip() if phone else None)
    if new_password:
        pwd_hash, salt = hash_password(new_password)
        updates.append("password_hash = %s")
        params.append(pwd_hash)
        updates.append("salt = %s")
        params.append(salt)

    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        query = f'UPDATE "Credentials-DownZaro" SET {", ".join(updates)} WHERE id = %s'
        params.append(user_id)
        execute_query(query, tuple(params), commit=True)

    return find_user_by_id(user_id)


def reset_user_password(destination: str, new_password: str):
    """Resets password for an existing user matching the email, username, or phone number."""
    user = find_user_by_identifier(destination)
    if not user:
        raise ValueError("No account found with this email, username, or phone number.")

    if len(new_password) < 6:
        raise ValueError("New password must be at least 6 characters long.")

    pwd_hash, salt = hash_password(new_password)
    query = '''
        UPDATE "Credentials-DownZaro"
        SET password_hash = %s, salt = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
    '''
    execute_query(query, (pwd_hash, salt, user["id"]), commit=True)
    return find_user_by_id(user["id"])

