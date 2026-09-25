from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import hashlib
import sqlite3
import json

from database import (
    get_connection,
    create_user,
    get_user_by_email,
    get_user_history
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# --------------------------------------------------
# Password hashing
# --------------------------------------------------

def hash_password(password: str):
    return hashlib.sha256(
        password.encode("utf-8")
    ).hexdigest()


# --------------------------------------------------
# Request models
# --------------------------------------------------

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AdminLoginRequest(BaseModel):
    username: str
    password: str


# --------------------------------------------------
# User Registration
# --------------------------------------------------

@router.post("/register")
def register(data: RegisterRequest):

    if len(data.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 6 characters"
        )

    user_id = create_user(
        data.username,
        data.email,
        hash_password(data.password)
    )

    if user_id is None:
        raise HTTPException(
            status_code=400,
            detail="Username or email already exists"
        )

    return {
        "message": "Registration successful",
        "user_id": user_id
    }


# --------------------------------------------------
# User Login
# --------------------------------------------------

@router.post("/login")
def login(data: LoginRequest):

    user = get_user_by_email(data.email)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_hash = hash_password(data.password)

    if user["password"] != password_hash:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return {
        "message": "Login successful",
        "user_id": user["id"],
        "username": user["username"],
        "email": user["email"]
    }


# --------------------------------------------------
# Admin Login
# --------------------------------------------------

@router.post("/admin-login")
def admin_login(data: AdminLoginRequest):

    # Demo admin credentials
    ADMIN_USERNAME = "admin"
    ADMIN_PASSWORD = "admin123"

    if (
        data.username != ADMIN_USERNAME
        or data.password != ADMIN_PASSWORD
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid admin credentials"
        )

    return {
        "message": "Admin login successful",
        "role": "admin",
        "username": "admin"
    }


# --------------------------------------------------
# User Prediction History
# --------------------------------------------------

@router.get("/history/{user_id}")
def history(user_id: int):

    records = get_user_history(user_id)

    result = []

    for record in records:

        item = dict(record)

        try:
            item["input_data"] = json.loads(
                item["input_data"]
            )
        except Exception:
            pass

        result.append(item)

    return {
        "user_id": user_id,
        "history": result
    }
