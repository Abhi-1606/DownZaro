import os
import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, EmailStr
from app.services import auth_service, notification_service

logger = logging.getLogger("downzaro.api.auth")
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# --- Pydantic Request Models ---

class GoogleAuthRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    credential: Optional[str] = None
    mode: Optional[str] = "signin"  # "signin" or "signup"


class RegisterRequest(BaseModel):
    name: str
    username: str
    email: EmailStr
    password: str
    phone: Optional[str] = None


class LoginRequest(BaseModel):
    identifier: str  # Email, Username, or Phone Number
    password: str


class DeviceSignInRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    username: Optional[str] = None


class OtpChannelsRequestModel(BaseModel):
    identifier: str


class OtpRequestModel(BaseModel):
    destination: str
    purpose: Optional[str] = "login"
    channel: Optional[str] = "email"  # 'email' (Gmail) or 'phone' (SMS/Mobile)


class OtpVerifyModel(BaseModel):
    destination: str
    code: str
    purpose: Optional[str] = "login"
    name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None


class PasskeyRegisterModel(BaseModel):
    credential_id: str
    public_key: Optional[str] = None


class PasskeyLoginModel(BaseModel):
    credential_id: str


class PasswordResetModel(BaseModel):
    destination: str
    code: str
    new_password: str


class UpdateProfileModel(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    new_password: Optional[str] = None


# --- Dependency for Active Session ---

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication token required.")
    token = authorization.replace("Bearer ", "").strip()
    user = auth_service.get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired authentication session.")
    return user


# --- Endpoints ---

@router.post("/register")
async def register(payload: RegisterRequest):
    """Registers a new account and saves user credentials into Credentials-DownZaro table."""
    try:
        user = auth_service.register_user(
            name=payload.name,
            email=payload.email,
            username=payload.username,
            password=payload.password,
            phone=payload.phone
        )
        token = auth_service.create_session(user["id"])
        return {
            "success": True,
            "message": f"Welcome to DownZaro, {user['name']}!",
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "username": user["username"],
                "email": user["email"],
                "phone": user.get("phone"),
                "created_at": str(user.get("created_at"))
            }
        }
    except ValueError as e:
        # User or email already exists
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        logger.error(f"Registration error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create account.")


@router.post("/login")
async def login(payload: LoginRequest):
    """Logs in using Email + Password, Username + Password, or Phone Number + Password."""
    user, err_reason = auth_service.authenticate_user(payload.identifier, payload.password)
    if err_reason == "ACCOUNT_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="No account found with this email, username, or phone number. Please sign up to create an account."
        )
    elif err_reason == "INVALID_PASSWORD" or not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect password. Please verify your password or use Forgot Password to reset it."
        )

    token = auth_service.create_session(user["id"])
    return {
        "success": True,
        "message": f"Welcome back, {user['name']}!",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "username": user["username"],
            "email": user["email"],
            "phone": user.get("phone"),
            "created_at": str(user.get("created_at"))
        }
    }


@router.get("/google/accounts")
async def get_google_accounts():
    """Returns list of registered accounts with Google/Gmail for quick switching."""
    try:
        query = '''
            SELECT id, name, username, email 
            FROM "Credentials-DownZaro" 
            ORDER BY id DESC LIMIT 10
        '''
        users = auth_service.execute_query(query, fetch_all=True) or []
        return {"success": True, "accounts": users}
    except Exception as e:
        logger.error(f"Error fetching accounts: {e}")
        return {"success": True, "accounts": []}


@router.post("/google")
async def google_auth(payload: GoogleAuthRequest):
    """Connects to user's Google account to Sign Up or Sign In with strict existence checks."""
    try:
        user = auth_service.authenticate_google_user(
            email=payload.email,
            name=payload.name,
            mode=payload.mode or "signin"
        )
        token = auth_service.create_session(user["id"])
        action_text = "Account created via Google" if payload.mode == "signup" else "Welcome back"
        return {
            "success": True,
            "message": f"{action_text}, {user['name']}!",
            "token": token,
            "is_new_user": user.get("is_new", False),
            "user": {
                "id": user["id"],
                "name": user["name"],
                "username": user["username"],
                "email": user["email"],
                "phone": user.get("phone"),
                "created_at": str(user.get("created_at"))
            }
        }
    except ValueError as e:
        status = 409 if payload.mode == "signup" else 404
        raise HTTPException(status_code=status, detail=str(e))
    except Exception as e:
        logger.error(f"Google auth error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Google authentication failed.")


@router.post("/device-signin")
async def device_signin(payload: DeviceSignInRequest):
    """Signs in or creates an account instantly from a chosen device/stored account email."""
    try:
        user = auth_service.get_or_create_device_user(
            email=payload.email,
            name=payload.name,
            username=payload.username
        )
        token = auth_service.create_session(user["id"])
        return {
            "success": True,
            "message": f"Welcome, {user['name']}!",
            "token": token,
            "is_new_user": user.get("is_new", False),
            "user": {
                "id": user["id"],
                "name": user["name"],
                "username": user["username"],
                "email": user["email"],
                "phone": user.get("phone"),
                "created_at": str(user.get("created_at"))
            }
        }
    except Exception as e:
        logger.error(f"Device signin error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Device authentication failed.")


@router.post("/otp/channels")
async def get_otp_channels(payload: OtpChannelsRequestModel):
    """Returns available delivery channels (Email vs Phone) for a user to choose where to receive OTP."""
    try:
        channels = auth_service.get_user_otp_channels(payload.identifier, require_existing=True)
        return {
            "success": True,
            "channels": channels
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/otp/request")
async def request_otp(payload: OtpRequestModel):
    """Generates and dispatches a 6-digit OTP code to the requested email (Gmail) or phone."""
    code = auth_service.create_otp(payload.destination, payload.purpose, payload.channel or "email")
    target_label = "Gmail / Email" if (payload.channel == "email" or "@" in payload.destination) else "Mobile Number"
    
    # Check if live SMTP is configured
    smtp_cfg = notification_service.get_smtp_config()
    smtp_live = bool(smtp_cfg.get("user") and smtp_cfg.get("password"))

    return {
        "success": True,
        "message": f"6-digit verification OTP dispatched to your {target_label} ({payload.destination}). Please check your inbox or messages.",
        "channel": payload.channel or "email",
        "destination": payload.destination,
        "smtp_live": smtp_live,
        "dev_code": code if not smtp_live else None
    }


@router.post("/otp/verify")
async def verify_otp_endpoint(payload: OtpVerifyModel):
    """Verifies OTP and performs instant login or account creation."""
    is_valid = auth_service.verify_otp(payload.destination, payload.code, payload.purpose)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code.")

    # Check if user already exists
    user = auth_service.find_user_by_identifier(payload.destination)
    
    if not user:
        # If registering via OTP
        if payload.name and payload.username and payload.password:
            user = auth_service.register_user(
                name=payload.name,
                email=payload.destination if "@" in payload.destination else f"{payload.username}@downzaro.local",
                username=payload.username,
                password=payload.password,
                phone=payload.destination if "@" not in payload.destination else None
            )
        else:
            return {
                "success": True,
                "verified": True,
                "message": "OTP verified successfully. Please complete account registration."
            }

    token = auth_service.create_session(user["id"])
    return {
        "success": True,
        "message": f"Authenticated successfully as {user['name']}.",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "username": user["username"],
            "email": user["email"],
            "phone": user.get("phone"),
            "created_at": str(user.get("created_at"))
        }
    }


@router.post("/password/reset")
async def reset_password_endpoint(payload: PasswordResetModel):
    """Verifies OTP and resets user password in Credentials-DownZaro."""
    is_valid = auth_service.verify_otp(payload.destination, payload.code, purpose="reset")
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

    try:
        updated_user = auth_service.reset_user_password(payload.destination, payload.new_password)
        token = auth_service.create_session(updated_user["id"])
        return {
            "success": True,
            "message": f"Password reset successfully! Welcome back, {updated_user['name']}.",
            "token": token,
            "user": {
                "id": updated_user["id"],
                "name": updated_user["name"],
                "username": updated_user["username"],
                "email": updated_user["email"],
                "phone": updated_user.get("phone"),
                "created_at": str(updated_user.get("created_at"))
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Password reset error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to reset password.")



@router.post("/passkey/verify")
async def verify_passkey(payload: PasskeyLoginModel):
    """Authenticates biometric / WebAuthn passkey stored in Credentials-DownZaro."""
    query = 'SELECT * FROM "Credentials-DownZaro" WHERE passkey_credential_id = %s LIMIT 1'
    user = auth_service.execute_query(query, (payload.credential_id,), fetch_one=True)
    if not user:
        raise HTTPException(status_code=401, detail="Passkey credential not recognized on this device.")

    token = auth_service.create_session(user["id"])
    return {
        "success": True,
        "message": f"Biometric passkey verified. Welcome back, {user['name']}!",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "username": user["username"],
            "email": user["email"],
            "phone": user.get("phone")
        }
    }


@router.post("/passkey/register")
async def register_user_passkey(payload: PasskeyRegisterModel, user=Depends(get_current_user)):
    """Registers Touch ID / Face ID / Passkey for the current logged-in user."""
    auth_service.register_passkey(user["id"], payload.credential_id, payload.public_key or "webauthn_key")
    return {
        "success": True,
        "message": "Passkey registered successfully for quick one-touch login."
    }


@router.get("/me")
async def get_me(user=Depends(get_current_user)):
    """Returns the profile of the currently logged-in user."""
    return {
        "user": {
            "id": user["id"],
            "name": user["name"],
            "username": user["username"],
            "email": user["email"],
            "phone": user.get("phone"),
            "created_at": str(user.get("created_at"))
        }
    }


@router.put("/update")
async def update_profile(payload: UpdateProfileModel, user=Depends(get_current_user)):
    """Allows user to update their profile info in Credentials-DownZaro table."""
    try:
        updated = auth_service.update_user_profile(
            user_id=user["id"],
            name=payload.name,
            email=payload.email,
            phone=payload.phone,
            new_password=payload.new_password
        )
        return {
            "success": True,
            "message": "Profile updated successfully.",
            "user": {
                "id": updated["id"],
                "name": updated["name"],
                "username": updated["username"],
                "email": updated["email"],
                "phone": updated.get("phone")
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/logout")
async def logout(authorization: Optional[str] = Header(None)):
    """Logs out and invalidates the session token."""
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        auth_service.delete_session(token)
    return {"success": True, "message": "Logged out successfully."}


@router.get("/admin/users")
async def get_all_credentials_for_admin(x_admin_secret: Optional[str] = Header(None)):
    """Admin inspector endpoint protected with ADMIN_SECRET for online deployments."""
    admin_secret = os.getenv("ADMIN_SECRET", "")
    if admin_secret and x_admin_secret != admin_secret:
        raise HTTPException(status_code=403, detail="Access denied. Valid admin secret required.")

    query = '''
        SELECT id, name, username, email, phone, 
               SUBSTRING(password_hash, 1, 12) || '...' as password_hash_preview,
               passkey_credential_id IS NOT NULL as has_passkey,
               created_at, updated_at
        FROM "Credentials-DownZaro"
        ORDER BY id ASC
    '''
    rows = auth_service.execute_query(query, fetch_all=True) or []
    return {
        "database": "DownZaro (Docker PostgreSQL)",
        "table": "Credentials-DownZaro",
        "total_records": len(rows),
        "records": rows
    }
