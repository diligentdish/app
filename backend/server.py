from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx
import random

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
)
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'blessed-belly-secret-key-2024')
JWT_ALGORITHM = "HS256"

# Stripe Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')

# LLM Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Admin emails - users with these emails get admin role
ADMIN_EMAILS = os.environ.get('ADMIN_EMAILS', 'admin@blessedbelly.com').split(',')

# Subscription price
BETA_PRICE = 9.00  # $9/month

# Create the main app
app = FastAPI(title="Blessed Belly API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "user"
    has_subscription: bool = False
    subscription_status: Optional[str] = None

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class CheckInRequest(BaseModel):
    signal: str  # stressed, low_energy, cravings, digestion, normal

class DailyCheckInResponse(BaseModel):
    check_in_id: str
    user_id: str
    date: str
    signal: str
    base_category: str
    action: Dict[str, Any]
    movement: Dict[str, Any]
    verse: Dict[str, Any]

class TriggerCardResponse(BaseModel):
    trigger_id: str
    trigger_type: str
    title: str
    immediate_action: str
    explanation: str
    body_truth: str
    verse: str
    verse_ref: str

class BASElineActionCreate(BaseModel):
    base_category: str  # B, A, S, E
    action_text: str
    movement_text: str

class TriggerCardCreate(BaseModel):
    trigger_type: str  # stressed, cravings, low_energy, after_meals, before_bed
    title: str
    immediate_action: str
    explanation: str
    body_truth: str
    verse: str
    verse_ref: str

class VerseCreate(BaseModel):
    verse_text: str
    verse_ref: str
    category: str  # B, A, S, E, general

class CheckoutRequest(BaseModel):
    origin_url: str

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_jwt_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> Optional[Dict]:
    """Get current user from JWT token or session cookie"""
    # Try session token from cookie first (Google OAuth)
    session_token = request.cookies.get("session_token")
    if session_token:
        session = await db.user_sessions.find_one(
            {"session_token": session_token},
            {"_id": 0}
        )
        if session:
            expires_at = session.get("expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user = await db.users.find_one(
                    {"user_id": session["user_id"]},
                    {"_id": 0}
                )
                if user:
                    return user
    
    # Try Authorization header (JWT)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user = await db.users.find_one(
                {"user_id": payload["user_id"]},
                {"_id": 0}
            )
            if user:
                return user
        except jwt.ExpiredSignatureError:
            pass
        except jwt.InvalidTokenError:
            pass
    
    return None

async def require_auth(request: Request) -> Dict:
    """Require authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def require_subscription(request: Request) -> Dict:
    """Require authenticated user with active subscription"""
    user = await require_auth(request)
    
    # Check subscription status
    subscription = await db.subscriptions.find_one(
        {"user_id": user["user_id"], "status": "active"},
        {"_id": 0}
    )
    
    if not subscription:
        raise HTTPException(status_code=403, detail="Active subscription required")
    
    return user

async def require_admin(request: Request) -> Dict:
    """Require admin user"""
    user = await require_auth(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============== HELPER FUNCTIONS ==============

def get_base_category(signal: str) -> str:
    """Map body signal to BASE category"""
    mapping = {
        "cravings": "B",
        "low_energy": "B",
        "stressed": "A",
        "digestion": "E",
        "normal": random.choice(["B", "A", "S", "E"])
    }
    return mapping.get(signal, "B")

def get_base_name(category: str) -> str:
    """Get full name for BASE category"""
    names = {
        "B": "Become Balanced",
        "A": "Activate Awareness",
        "S": "Support Strength",
        "E": "Engage Your Gut"
    }
    return names.get(category, "Become Balanced")

async def generate_ai_recommendation(user_name: str, signal: str, base_category: str, recent_actions: List[str] = None) -> Dict:
    """Generate personalized AI recommendation based on user's body signal"""
    
    signal_descriptions = {
        "stressed": "feeling stressed or overwhelmed",
        "low_energy": "experiencing low energy or fatigue",
        "cravings": "having food cravings",
        "digestion": "having digestive discomfort or bloating",
        "normal": "feeling relatively normal today"
    }
    
    base_descriptions = {
        "B": "Become Balanced - focusing on balanced meals, blood sugar stability, and the 80/20 nutrition approach",
        "A": "Activate Awareness - focusing on mindful eating, stress awareness, and gratitude",
        "S": "Support Strength - focusing on simple daily movement and gentle strength",
        "E": "Engage Your Gut - focusing on gut health, fiber, and digestion support"
    }
    
    recent_context = ""
    if recent_actions and len(recent_actions) > 0:
        recent_context = f"\n\nRecent actions this user has received (avoid repeating): {', '.join(recent_actions[-5:])}"
    
    system_prompt = """You are a holistic nutritionist and wellness coach for Blessed Belly, a faith-informed metabolic health app for busy Christian women who want to lose stubborn belly fat without dieting or calorie counting.

Your role is to provide ONE simple, strategic, science-backed action that creates an immediate win. Your advice should:
1. Be specific, actionable, and doable in a busy woman's day
2. Include the scientific "why" in plain language (2-3 sentences)
3. Give concrete examples they can use RIGHT NOW
4. Build mindfulness and body awareness over time
5. Be warm, empowering, and grace-filled (not preachy)
6. Never mention calories, dieting, or restriction
7. Focus on adding good things, not removing "bad" things

Always respond in valid JSON format with these exact fields:
{
    "action_text": "The ONE specific action for today (1-2 sentences)",
    "why_it_helps": "Science-backed explanation in plain language (2-3 sentences)",
    "examples": "Specific, practical examples they can use immediately (2-3 sentences)",
    "movement_text": "One simple movement suggestion related to the action (1 sentence)",
    "verse_text": "A relevant scripture verse about the body, health, rest, or God's care",
    "verse_ref": "The scripture reference (e.g., 'Proverbs 3:5-6')"
}"""

    user_prompt = f"""Generate a personalized recommendation for {user_name}.

Current state: She is {signal_descriptions.get(signal, 'checking in')}.
Focus area: {base_descriptions.get(base_category, 'general wellness')}
{recent_context}

Provide ONE strategic action that will give her an immediate win and help her body feel better. Make it specific to her current state, backed by science, and easy to implement in her busy day."""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"recommendation_{uuid.uuid4().hex[:8]}",
            system_message=system_prompt
        ).with_model("openai", "gpt-4o")
        
        response = await chat.send_message(UserMessage(text=user_prompt))
        
        # Parse the JSON response
        # Clean up response if needed (remove markdown code blocks)
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        recommendation = json.loads(response_text)
        
        return {
            "action_text": recommendation.get("action_text", ""),
            "why_it_helps": recommendation.get("why_it_helps", ""),
            "examples": recommendation.get("examples", ""),
            "movement_text": recommendation.get("movement_text", ""),
            "verse_text": recommendation.get("verse_text", ""),
            "verse_ref": recommendation.get("verse_ref", "")
        }
        
    except Exception as e:
        logger.error(f"AI recommendation error: {e}")
        # Fallback to a default recommendation
        return None

# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new user with email/password"""
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    role = "admin" if user_data.email in ADMIN_EMAILS else "user"
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "picture": None,
        "role": role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_jwt_token(user_id)
    
    # Check subscription
    subscription = await db.subscriptions.find_one(
        {"user_id": user_id, "status": "active"},
        {"_id": 0}
    )
    
    return TokenResponse(
        token=token,
        user=UserResponse(
            user_id=user_id,
            email=user_data.email,
            name=user_data.name,
            role=role,
            has_subscription=bool(subscription),
            subscription_status=subscription.get("status") if subscription else None
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login with email/password"""
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user["user_id"])
    
    # Check subscription
    subscription = await db.subscriptions.find_one(
        {"user_id": user["user_id"], "status": "active"},
        {"_id": 0}
    )
    
    return TokenResponse(
        token=token,
        user=UserResponse(
            user_id=user["user_id"],
            email=user["email"],
            name=user["name"],
            picture=user.get("picture"),
            role=user.get("role", "user"),
            has_subscription=bool(subscription),
            subscription_status=subscription.get("status") if subscription else None
        )
    )

@api_router.post("/auth/google/session")
async def google_session(request: Request, response: Response):
    """Exchange Google OAuth session_id for session_token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get user data
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    async with httpx.AsyncClient() as client:
        auth_response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    
    if auth_response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    auth_data = auth_response.json()
    email = auth_data["email"]
    name = auth_data["name"]
    picture = auth_data.get("picture")
    session_token = auth_data["session_token"]
    
    # Find or create user
    user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if user:
        user_id = user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        role = "admin" if email in ADMIN_EMAILS else "user"
        
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": role,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
        user = user_doc
    
    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60  # 7 days
    )
    
    # Check subscription
    subscription = await db.subscriptions.find_one(
        {"user_id": user_id, "status": "active"},
        {"_id": 0}
    )
    
    return {
        "user": {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": user.get("role", "user"),
            "has_subscription": bool(subscription),
            "subscription_status": subscription.get("status") if subscription else None
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check subscription
    subscription = await db.subscriptions.find_one(
        {"user_id": user["user_id"], "status": "active"},
        {"_id": 0}
    )
    
    return UserResponse(
        user_id=user["user_id"],
        email=user["email"],
        name=user["name"],
        picture=user.get("picture"),
        role=user.get("role", "user"),
        has_subscription=bool(subscription),
        subscription_status=subscription.get("status") if subscription else None
    )

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============== SUBSCRIPTION ENDPOINTS ==============

@api_router.post("/checkout/session")
async def create_checkout_session(checkout_req: CheckoutRequest, request: Request):
    """Create Stripe checkout session for subscription"""
    user = await require_auth(request)
    
    # Build URLs from provided origin
    success_url = f"{checkout_req.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{checkout_req.origin_url}/pricing"
    
    # Initialize Stripe
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Create checkout session
    checkout_request = CheckoutSessionRequest(
        amount=BETA_PRICE,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["user_id"],
            "user_email": user["email"],
            "plan": "beta_monthly"
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    await db.payment_transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "session_id": session.session_id,
        "user_id": user["user_id"],
        "email": user["email"],
        "amount": BETA_PRICE,
        "currency": "usd",
        "plan": "beta_monthly",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, request: Request):
    """Get checkout session status"""
    user = await require_auth(request)
    
    # Initialize Stripe
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Get status from Stripe
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction
    transaction = await db.payment_transactions.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    
    if transaction and transaction.get("payment_status") != "paid" and status.payment_status == "paid":
        # Update transaction status
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": status.payment_status,
                "status": status.status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Create or update subscription
        await db.subscriptions.update_one(
            {"user_id": user["user_id"]},
            {"$set": {
                "subscription_id": f"sub_{uuid.uuid4().hex[:12]}",
                "user_id": user["user_id"],
                "plan": "beta_monthly",
                "status": "active",
                "amount": BETA_PRICE,
                "started_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(
        api_key=STRIPE_API_KEY, 
        webhook_url=webhook_url,
        webhook_secret=STRIPE_WEBHOOK_SECRET
    )
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            user_id = webhook_response.metadata.get("user_id")
            user_email = webhook_response.metadata.get("user_email")
            logger.info(f"Payment successful for user: {user_id} ({user_email})")
            
            if user_id:
                await db.subscriptions.update_one(
                    {"user_id": user_id},
                    {"$set": {
                        "subscription_id": f"sub_{uuid.uuid4().hex[:12]}",
                        "user_id": user_id,
                        "plan": "beta_monthly",
                        "status": "active",
                        "amount": BETA_PRICE,
                        "started_at": datetime.now(timezone.utc).isoformat(),
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }},
                    upsert=True
                )
                logger.info(f"Subscription activated for user: {user_id}")
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True}

@api_router.get("/subscription/status")
async def get_subscription_status(request: Request):
    """Get current user's subscription status"""
    user = await require_auth(request)
    
    subscription = await db.subscriptions.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0}
    )
    
    return {
        "has_subscription": bool(subscription and subscription.get("status") == "active"),
        "subscription": subscription
    }

# ============== DASHBOARD ENDPOINTS ==============

@api_router.post("/checkin", response_model=DailyCheckInResponse)
async def daily_checkin(checkin: CheckInRequest, request: Request):
    """Submit daily check-in and get today's BASEline"""
    user = await require_subscription(request)
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    base_category = get_base_category(checkin.signal)
    
    # Get random action for this BASE category
    actions = await db.baseline_actions.find(
        {"base_category": base_category},
        {"_id": 0}
    ).to_list(100)
    
    if not actions:
        # Use default if no actions in DB
        action = {
            "action_id": "default",
            "action_text": "Take three deep breaths before your next meal",
            "movement_text": "Take a 10-minute walk after eating"
        }
    else:
        action = random.choice(actions)
    
    # Get random verse for this category
    verses = await db.verses.find(
        {"category": {"$in": [base_category, "general"]}},
        {"_id": 0}
    ).to_list(100)
    
    if not verses:
        # Use default verse
        verse = {
            "verse_id": "default",
            "verse_text": "Do you not know that your bodies are temples of the Holy Spirit?",
            "verse_ref": "1 Corinthians 6:19"
        }
    else:
        verse = random.choice(verses)
    
    # Create check-in record
    check_in_id = f"checkin_{uuid.uuid4().hex[:12]}"
    check_in_doc = {
        "check_in_id": check_in_id,
        "user_id": user["user_id"],
        "date": today,
        "signal": checkin.signal,
        "base_category": base_category,
        "action_id": action.get("action_id", "default"),
        "verse_id": verse.get("verse_id", "default"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Upsert - replace if already checked in today
    await db.daily_checkins.update_one(
        {"user_id": user["user_id"], "date": today},
        {"$set": check_in_doc},
        upsert=True
    )
    
    return DailyCheckInResponse(
        check_in_id=check_in_id,
        user_id=user["user_id"],
        date=today,
        signal=checkin.signal,
        base_category=base_category,
        action={
            "text": action.get("action_text", ""),
            "why_it_helps": action.get("why_it_helps", ""),
            "examples": action.get("examples", ""),
            "base_name": get_base_name(base_category),
            "base_letter": base_category
        },
        movement={
            "text": action.get("movement_text", "")
        },
        verse={
            "text": verse.get("verse_text", ""),
            "reference": verse.get("verse_ref", "")
        }
    )

@api_router.get("/checkin/today")
async def get_today_checkin(request: Request):
    """Get today's check-in if exists"""
    user = await require_subscription(request)
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    checkin = await db.daily_checkins.find_one(
        {"user_id": user["user_id"], "date": today},
        {"_id": 0}
    )
    
    if not checkin:
        return {"has_checkin": False}
    
    # Get action details
    action = await db.baseline_actions.find_one(
        {"action_id": checkin.get("action_id")},
        {"_id": 0}
    )
    
    if not action:
        action = {
            "action_text": "Take three deep breaths before your next meal",
            "movement_text": "Take a 10-minute walk after eating"
        }
    
    # Get verse details
    verse = await db.verses.find_one(
        {"verse_id": checkin.get("verse_id")},
        {"_id": 0}
    )
    
    if not verse:
        verse = {
            "verse_text": "Do you not know that your bodies are temples of the Holy Spirit?",
            "verse_ref": "1 Corinthians 6:19"
        }
    
    return {
        "has_checkin": True,
        "check_in_id": checkin["check_in_id"],
        "date": checkin["date"],
        "signal": checkin["signal"],
        "base_category": checkin["base_category"],
        "action": {
            "text": action.get("action_text", ""),
            "why_it_helps": action.get("why_it_helps", ""),
            "examples": action.get("examples", ""),
            "base_name": get_base_name(checkin["base_category"]),
            "base_letter": checkin["base_category"]
        },
        "movement": {
            "text": action.get("movement_text", "")
        },
        "verse": {
            "text": verse.get("verse_text", ""),
            "reference": verse.get("verse_ref", "")
        }
    }

# ============== TRIGGER LIBRARY ENDPOINTS ==============

@api_router.get("/triggers", response_model=List[TriggerCardResponse])
async def get_all_triggers(request: Request):
    """Get all trigger cards"""
    await require_subscription(request)
    
    triggers = await db.trigger_cards.find({}, {"_id": 0}).to_list(100)
    
    return [TriggerCardResponse(**t) for t in triggers]

@api_router.get("/triggers/{trigger_type}")
async def get_trigger_by_type(trigger_type: str, request: Request):
    """Get trigger cards by type"""
    await require_subscription(request)
    
    triggers = await db.trigger_cards.find(
        {"trigger_type": trigger_type},
        {"_id": 0}
    ).to_list(10)
    
    if not triggers:
        raise HTTPException(status_code=404, detail="No triggers found")
    
    return triggers

# ============== ADMIN ENDPOINTS ==============

@api_router.post("/admin/actions")
async def create_action(action: BASElineActionCreate, request: Request):
    """Create a new BASEline action"""
    await require_admin(request)
    
    action_id = f"action_{uuid.uuid4().hex[:12]}"
    action_doc = {
        "action_id": action_id,
        **action.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.baseline_actions.insert_one(action_doc)
    return {"action_id": action_id, "message": "Action created"}

@api_router.get("/admin/actions")
async def get_all_actions(request: Request):
    """Get all BASEline actions"""
    await require_admin(request)
    
    actions = await db.baseline_actions.find({}, {"_id": 0}).to_list(1000)
    return actions

@api_router.delete("/admin/actions/{action_id}")
async def delete_action(action_id: str, request: Request):
    """Delete a BASEline action"""
    await require_admin(request)
    
    result = await db.baseline_actions.delete_one({"action_id": action_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Action not found")
    return {"message": "Action deleted"}

@api_router.post("/admin/triggers")
async def create_trigger(trigger: TriggerCardCreate, request: Request):
    """Create a new trigger card"""
    await require_admin(request)
    
    trigger_id = f"trigger_{uuid.uuid4().hex[:12]}"
    trigger_doc = {
        "trigger_id": trigger_id,
        **trigger.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.trigger_cards.insert_one(trigger_doc)
    return {"trigger_id": trigger_id, "message": "Trigger created"}

@api_router.get("/admin/triggers")
async def get_all_admin_triggers(request: Request):
    """Get all trigger cards (admin)"""
    await require_admin(request)
    
    triggers = await db.trigger_cards.find({}, {"_id": 0}).to_list(1000)
    return triggers

@api_router.delete("/admin/triggers/{trigger_id}")
async def delete_trigger(trigger_id: str, request: Request):
    """Delete a trigger card"""
    await require_admin(request)
    
    result = await db.trigger_cards.delete_one({"trigger_id": trigger_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Trigger not found")
    return {"message": "Trigger deleted"}

@api_router.post("/admin/verses")
async def create_verse(verse: VerseCreate, request: Request):
    """Create a new verse"""
    await require_admin(request)
    
    verse_id = f"verse_{uuid.uuid4().hex[:12]}"
    verse_doc = {
        "verse_id": verse_id,
        **verse.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.verses.insert_one(verse_doc)
    return {"verse_id": verse_id, "message": "Verse created"}

@api_router.get("/admin/verses")
async def get_all_verses(request: Request):
    """Get all verses"""
    await require_admin(request)
    
    verses = await db.verses.find({}, {"_id": 0}).to_list(1000)
    return verses

@api_router.delete("/admin/verses/{verse_id}")
async def delete_verse(verse_id: str, request: Request):
    """Delete a verse"""
    await require_admin(request)
    
    result = await db.verses.delete_one({"verse_id": verse_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Verse not found")
    return {"message": "Verse deleted"}

# ============== SEED DATA ENDPOINT ==============

@api_router.post("/admin/seed")
async def seed_data(request: Request):
    """Seed initial data for the app"""
    # Allow seeding without auth for initial setup
    
    # Check if data already exists
    actions_count = await db.baseline_actions.count_documents({})
    if actions_count > 0:
        return {"message": "Data already seeded"}
    
    # BASEline Actions with educational content
    baseline_actions = [
        # B - Become Balanced
        {
            "action_id": "action_b1",
            "base_category": "B",
            "action_text": "Start your next meal with protein first, then vegetables, then carbs.",
            "why_it_helps": "Eating in this order slows down how quickly sugar enters your bloodstream. When you eat carbs first, your blood sugar spikes and crashes—leaving you tired and hungry. Protein and vegetables create a 'buffer' that keeps your energy steady.",
            "examples": "Protein options: grilled chicken, salmon, eggs, Greek yogurt, cottage cheese, lentils, or black beans. Eat a few bites of these before touching your rice, bread, or pasta.",
            "movement_text": "Take a gentle 10-minute walk after eating."
        },
        {
            "action_id": "action_b2",
            "base_category": "B",
            "action_text": "Add a healthy fat to your next meal.",
            "why_it_helps": "Healthy fats help you feel satisfied longer and support hormone balance. They also help your body absorb important vitamins (A, D, E, K) from your vegetables. Fat doesn't make you fat—it helps regulate hunger.",
            "examples": "Easy additions: half an avocado, a drizzle of olive oil on salad, a handful of almonds or walnuts, a spoonful of nut butter, or cooking with coconut oil.",
            "movement_text": "Do 5 slow squats before your meal."
        },
        {
            "action_id": "action_b3",
            "base_category": "B",
            "action_text": "Drink a full glass of water 15 minutes before eating.",
            "why_it_helps": "Often what feels like hunger is actually thirst. Drinking water before meals helps you eat the right amount and supports digestion. It also gives your brain time to recognize fullness signals.",
            "examples": "One full glass is about 8 ounces. Room temperature or warm water is easier on digestion than ice cold. Add a squeeze of lemon if plain water feels boring.",
            "movement_text": "Stretch your arms overhead 10 times."
        },
        {
            "action_id": "action_b4",
            "base_category": "B",
            "action_text": "Include fiber-rich vegetables in your lunch today.",
            "why_it_helps": "Fiber is like a broom for your digestive system—it keeps things moving and feeds the good bacteria in your gut. It also slows sugar absorption, preventing energy crashes. Most women don't get nearly enough fiber.",
            "examples": "High-fiber veggies: broccoli, Brussels sprouts, artichokes, green peas, carrots, sweet potatoes, spinach, kale. Even adding a side salad counts! Aim for your veggies to fill half your plate.",
            "movement_text": "Walk around the block after lunch."
        },
        
        # A - Activate Awareness
        {
            "action_id": "action_a1",
            "base_category": "A",
            "action_text": "Before eating, pause and take 3 deep breaths. Notice your hunger level on a scale of 1-10.",
            "why_it_helps": "When you're stressed, your body is in 'fight or flight' mode and can't digest food properly. Three deep breaths activate your 'rest and digest' system. Rating your hunger builds awareness—many of us eat when we're not actually hungry.",
            "examples": "1-3 = not hungry (eating from boredom or stress), 4-6 = moderately hungry (good time to eat), 7-10 = very hungry (try not to get here—you'll overeat). Ideally, eat when you're at a 5-6.",
            "movement_text": "Roll your shoulders back 10 times to release tension."
        },
        {
            "action_id": "action_a2",
            "base_category": "A",
            "action_text": "Put your fork down between bites for your next meal.",
            "why_it_helps": "It takes about 20 minutes for your brain to receive fullness signals. When you eat quickly, you overshoot fullness before your brain catches up. Slowing down helps you eat the right amount naturally.",
            "examples": "Take a bite, set down your fork, chew completely, swallow, then pick up your fork again. It feels awkward at first but becomes natural. Notice how food tastes more flavorful when you slow down.",
            "movement_text": "Take a 5-minute walking break outside."
        },
        {
            "action_id": "action_a3",
            "base_category": "A",
            "action_text": "Write down one thing you're grateful for about your body today.",
            "why_it_helps": "Gratitude rewires your brain away from criticism and toward appreciation. When you appreciate your body, you naturally want to care for it better. This shifts eating from punishment to nourishment.",
            "examples": "Examples: 'I'm grateful my legs carried me today,' 'I'm thankful for arms that hug my children,' 'I appreciate that my body healed from that cold,' 'I'm grateful for eyes that see the sunrise.'",
            "movement_text": "Do gentle neck stretches for 2 minutes."
        },
        {
            "action_id": "action_a4",
            "base_category": "A",
            "action_text": "Eat one meal today without screens or distractions.",
            "why_it_helps": "Distracted eating leads to overeating because you're not paying attention to fullness cues. Studies show people eat significantly more when watching TV or scrolling their phones. Single-tasking helps you enjoy food more with less.",
            "examples": "Turn off the TV, put your phone in another room, step away from your desk. Sit at a table, look at your food, notice the colors and smells. Even 10 minutes of focused eating makes a difference.",
            "movement_text": "Stand and stretch every hour today."
        },
        
        # S - Support Strength
        {
            "action_id": "action_s1",
            "base_category": "S",
            "action_text": "Stand up and move for 5 minutes every hour today.",
            "why_it_helps": "Sitting for long periods slows your metabolism and makes your body store more fat around your middle. Brief movement breaks keep your blood flowing and your metabolism active. It also improves focus and energy.",
            "examples": "Set a phone timer. Walk to get water, do a lap around your house or office, march in place, do some arm circles. Even standing and stretching counts. The goal is breaking up long sitting periods.",
            "movement_text": "Do 10 wall push-ups."
        },
        {
            "action_id": "action_s2",
            "base_category": "S",
            "action_text": "Take the stairs instead of the elevator today.",
            "why_it_helps": "Stair climbing is a simple way to build leg strength and get your heart rate up without 'working out.' Strong muscles burn more calories even at rest. Small choices add up to big changes over time.",
            "examples": "Start with one flight and take the elevator the rest of the way if needed. Hold the railing if balance is a concern. Climb at your own pace—there's no rush. Count it as a win even if it's just a few stairs.",
            "movement_text": "Hold a 30-second plank."
        },
        {
            "action_id": "action_s3",
            "base_category": "S",
            "action_text": "Park farther away from your destination today.",
            "why_it_helps": "Extra steps throughout the day add up significantly. This 'hidden exercise' boosts your daily movement without requiring gym time. Walking also reduces stress hormones that contribute to belly fat.",
            "examples": "Park at the back of the parking lot, get off the bus one stop early, walk to a colleague's desk instead of emailing. Aim for an extra 5-10 minutes of walking spread throughout the day.",
            "movement_text": "Do 15 standing calf raises."
        },
        {
            "action_id": "action_s4",
            "base_category": "S",
            "action_text": "Do gentle stretches while waiting for your morning coffee.",
            "why_it_helps": "Morning stretching wakes up your muscles, improves circulation, and sets a positive tone for the day. Stiff muscles can lead to poor posture, which affects digestion and how your body stores fat around your midsection.",
            "examples": "While the coffee brews: reach arms overhead, twist gently side to side, roll your neck, touch your toes (or reach toward them), do a few hip circles. 2-3 minutes is all you need.",
            "movement_text": "Walk for 15 minutes after dinner."
        },
        
        # E - Engage Your Gut
        {
            "action_id": "action_e1",
            "base_category": "E",
            "action_text": "Add a probiotic food to one meal today.",
            "why_it_helps": "Your gut contains trillions of bacteria that affect weight, mood, and immune function. Probiotic foods add beneficial bacteria to your gut, improving digestion and reducing bloating. A healthy gut microbiome is linked to less belly fat.",
            "examples": "Probiotic-rich foods: plain Greek yogurt (check for 'live cultures'), kefir, sauerkraut, kimchi, miso soup, tempeh, kombucha. Start small—even a few spoonfuls of sauerkraut on the side counts.",
            "movement_text": "Do gentle torso twists after eating."
        },
        {
            "action_id": "action_e2",
            "base_category": "E",
            "action_text": "Chew each bite 20-30 times during your next meal.",
            "why_it_helps": "Digestion starts in your mouth. Chewing thoroughly breaks down food so your stomach works less hard. It also releases more nutrients and gives your brain time to register fullness. Most of us chew only 5-10 times!",
            "examples": "Count your chews for a few bites to see where you're starting. Put your fork down while chewing. Notice how food becomes almost liquid before you swallow. Soup and smoothies don't count for this practice!",
            "movement_text": "Take a slow 15-minute walk to aid digestion."
        },
        {
            "action_id": "action_e3",
            "base_category": "E",
            "action_text": "Drink warm water with lemon first thing in the morning.",
            "why_it_helps": "After sleeping, your body is dehydrated and your digestive system is sluggish. Warm lemon water hydrates you, stimulates digestion, and supports your liver's natural detox processes. It's a gentle wake-up call for your gut.",
            "examples": "Heat water to warm (not boiling), squeeze half a lemon, drink before breakfast. Use a straw if you're concerned about enamel. Fresh lemon is better than bottled juice. Do this before coffee for best results.",
            "movement_text": "Do gentle belly breathing for 5 minutes."
        },
        {
            "action_id": "action_e4",
            "base_category": "E",
            "action_text": "Stop eating when you feel 80% full.",
            "why_it_helps": "The Japanese call this 'hara hachi bu.' Your stomach is about the size of your fist and can stretch—but shouldn't have to. Stopping at 80% prevents the stuffed feeling and gives your digestive system room to work efficiently.",
            "examples": "80% full feels like: satisfied but not stuffed, you could eat more but don't need to, no belly discomfort, you still have energy. 100% full feels like: needing to unbutton pants, feeling sleepy, slight nausea.",
            "movement_text": "Light stretching before bed."
        },
    ]
    
    # Trigger Cards
    trigger_cards = [
        {
            "trigger_id": "trigger_stressed1",
            "trigger_type": "stressed",
            "title": "Feeling Stressed?",
            "immediate_action": "Step away from what you're doing. Place one hand on your heart and breathe deeply for 60 seconds.",
            "explanation": "Stress triggers cortisol, which can increase belly fat storage. Taking a moment to calm your nervous system helps your body shift from 'fight or flight' to 'rest and digest.'",
            "body_truth": "Your body is designed to handle stress, but it also needs moments of peace. You can create calm within chaos.",
            "verse": "Come to me, all you who are weary and burdened, and I will give you rest.",
            "verse_ref": "Matthew 11:28"
        },
        {
            "trigger_id": "trigger_cravings1",
            "trigger_type": "cravings",
            "title": "Having Cravings?",
            "immediate_action": "Drink a full glass of water and wait 10 minutes. Often thirst masquerades as hunger.",
            "explanation": "Cravings often signal blood sugar imbalance or emotional needs. Pausing before acting helps you respond rather than react.",
            "body_truth": "Cravings are information, not commands. Your body is communicating—listen with curiosity, not judgment.",
            "verse": "For I am the Lord your God who takes hold of your right hand and says to you, Do not fear; I will help you.",
            "verse_ref": "Isaiah 41:13"
        },
        {
            "trigger_id": "trigger_lowenergy1",
            "trigger_type": "low_energy",
            "title": "Feeling Low Energy?",
            "immediate_action": "Stand up, stretch your arms overhead, and take 5 deep breaths. Then drink a glass of water.",
            "explanation": "Low energy often comes from dehydration, blood sugar dips, or simply sitting too long. Movement and hydration are natural energizers.",
            "body_truth": "Your body has energy reserves—sometimes it just needs a gentle nudge to access them.",
            "verse": "But those who hope in the Lord will renew their strength. They will soar on wings like eagles.",
            "verse_ref": "Isaiah 40:31"
        },
        {
            "trigger_id": "trigger_aftermeals1",
            "trigger_type": "after_meals",
            "title": "After Meals",
            "immediate_action": "Take a gentle 10-minute walk. Even pacing inside your home helps.",
            "explanation": "Moving after eating helps stabilize blood sugar and aids digestion. It doesn't need to be intense—gentle is perfect.",
            "body_truth": "Your body processes food better when you move. This is gentle care, not punishment.",
            "verse": "So whether you eat or drink or whatever you do, do it all for the glory of God.",
            "verse_ref": "1 Corinthians 10:31"
        },
        {
            "trigger_id": "trigger_beforebed1",
            "trigger_type": "before_bed",
            "title": "Before Bed",
            "immediate_action": "Stop eating 2-3 hours before sleep. Do gentle stretches and write one gratitude in your journal.",
            "explanation": "Quality sleep is essential for metabolic health. Creating a calm evening routine supports your body's natural healing processes.",
            "body_truth": "Rest is productive. Your body does important repair work while you sleep.",
            "verse": "In peace I will lie down and sleep, for you alone, Lord, make me dwell in safety.",
            "verse_ref": "Psalm 4:8"
        }
    ]
    
    # Verses
    verses = [
        # B - Become Balanced
        {"verse_id": "verse_b1", "verse_text": "Whether you eat or drink or whatever you do, do it all for the glory of God.", "verse_ref": "1 Corinthians 10:31", "category": "B"},
        {"verse_id": "verse_b2", "verse_text": "Everything is permissible for me—but not everything is beneficial.", "verse_ref": "1 Corinthians 6:12", "category": "B"},
        {"verse_id": "verse_b3", "verse_text": "Do not join those who drink too much wine or gorge themselves on meat.", "verse_ref": "Proverbs 23:20", "category": "B"},
        
        # A - Activate Awareness
        {"verse_id": "verse_a1", "verse_text": "Be still, and know that I am God.", "verse_ref": "Psalm 46:10", "category": "A"},
        {"verse_id": "verse_a2", "verse_text": "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.", "verse_ref": "Philippians 4:6", "category": "A"},
        {"verse_id": "verse_a3", "verse_text": "The peace of God, which transcends all understanding, will guard your hearts and your minds.", "verse_ref": "Philippians 4:7", "category": "A"},
        
        # S - Support Strength
        {"verse_id": "verse_s1", "verse_text": "I can do all things through Christ who strengthens me.", "verse_ref": "Philippians 4:13", "category": "S"},
        {"verse_id": "verse_s2", "verse_text": "She sets about her work vigorously; her arms are strong for her tasks.", "verse_ref": "Proverbs 31:17", "category": "S"},
        {"verse_id": "verse_s3", "verse_text": "Physical training is of some value, but godliness has value for all things.", "verse_ref": "1 Timothy 4:8", "category": "S"},
        
        # E - Engage Your Gut
        {"verse_id": "verse_e1", "verse_text": "Do you not know that your bodies are temples of the Holy Spirit?", "verse_ref": "1 Corinthians 6:19", "category": "E"},
        {"verse_id": "verse_e2", "verse_text": "Gracious words are a honeycomb, sweet to the soul and healing to the bones.", "verse_ref": "Proverbs 16:24", "category": "E"},
        {"verse_id": "verse_e3", "verse_text": "A cheerful heart is good medicine, but a crushed spirit dries up the bones.", "verse_ref": "Proverbs 17:22", "category": "E"},
        
        # General
        {"verse_id": "verse_g1", "verse_text": "For you created my inmost being; you knit me together in my mother's womb. I praise you because I am fearfully and wonderfully made.", "verse_ref": "Psalm 139:13-14", "category": "general"},
        {"verse_id": "verse_g2", "verse_text": "Do not conform to the pattern of this world, but be transformed by the renewing of your mind.", "verse_ref": "Romans 12:2", "category": "general"},
        {"verse_id": "verse_g3", "verse_text": "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.", "verse_ref": "Galatians 5:22-23", "category": "general"},
    ]
    
    # Insert all data
    await db.baseline_actions.insert_many(baseline_actions)
    await db.trigger_cards.insert_many(trigger_cards)
    await db.verses.insert_many(verses)
    
    return {"message": "Data seeded successfully", "actions": len(baseline_actions), "triggers": len(trigger_cards), "verses": len(verses)}

# ============== HEALTH CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "Blessed Belly API", "status": "healthy"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
