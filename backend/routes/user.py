from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from backend.DATABASE.database import get_db_cursor
from mysql.connector.errors import Error as MySQLError
from backend.services.auth import create_access_token, get_password_hash, verify_password, verify_token
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

from pydantic import validator

class UserProfile(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str  # Now required
    country: Optional[str] = None
    state: Optional[str] = None

    @validator('phone')
    def validate_phone(cls, v):
        # Remove any non-digit characters
        cleaned = ''.join(filter(str.isdigit, v))
        if len(cleaned) < 10:
            raise ValueError('Phone number must have at least 10 digits')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    phone: Optional[str]
    country: Optional[str]
    state: Optional[str]
    created_at: str
    last_active: str
    access_token: str

async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Get current user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split(" ")[1]
    return verify_token(token)

@router.post("/login", response_model=UserResponse)
async def login(login_data: UserLogin) -> Dict[str, Any]:
    """Login with email and password"""
    try:
        with get_db_cursor() as (cursor, conn):
            cursor.execute("""
                SELECT id, email, name, phone, country, state,
                       created_at, last_active, password
                FROM users 
                WHERE email = %s
            """, (login_data.email,))
            
            user = cursor.fetchone()
            if not user:
                raise HTTPException(status_code=401, detail="Invalid email or password")

            try:
                if not verify_password(login_data.password, user['password']):
                    raise HTTPException(status_code=401, detail="Invalid email or password")

                # Update last_active timestamp
                cursor.execute(
                    "UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = %s",
                    (user['id'],)
                )
            except Exception as e:
                logger.error(f"Error verifying password: {e}")
                raise HTTPException(status_code=401, detail="Invalid email or password")
            conn.commit()

            # Create access token
            access_token = create_access_token({"sub": user['email']})

            # Return user data with token
            return {
                **user,
                'created_at': user['created_at'].isoformat(),
                'last_active': user['last_active'].isoformat(),
                'access_token': access_token
            }

    except MySQLError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/profile", response_model=UserResponse)
async def create_or_update_profile(profile: UserProfile) -> Dict[str, Any]:
    """Create or update user profile with password"""
    logger.info(f"Attempting to create/update profile for email: {profile.email}")
    try:
        with get_db_cursor() as (cursor, conn):
            # Check if user exists
            cursor.execute(
                "SELECT id, password FROM users WHERE email = %s",
                (profile.email,)
            )
            user = cursor.fetchone()
            logger.info(f"User exists check: {'Found' if user else 'Not found'}")

            try:
                # Hash the password
                hashed_password = get_password_hash(profile.password)
            except Exception as e:
                logger.error(f"Error hashing password: {e}")
                raise HTTPException(status_code=400, detail=f"Invalid password format: {str(e)}")
            
            if user:
                logger.info(f"Updating existing user: {profile.email}")
                # Update existing user
                try:
                    cursor.execute("""
                        UPDATE users 
                        SET name = %s, phone = %s, 
                            country = %s, state = %s,
                            password = %s,
                            last_active = CURRENT_TIMESTAMP
                        WHERE email = %s
                    """, (
                        profile.name, profile.phone,
                        profile.country, profile.state,
                        hashed_password,
                        profile.email
                    ))
                    user_id = user['id']
                except MySQLError as e:
                    logger.error(f"Error updating user: {e}")
                    raise HTTPException(status_code=500, detail=f"Error updating user profile: {str(e)}")
            else:
                logger.info(f"Creating new user: {profile.email}")
                # Create new user
                try:
                    cursor.execute("""
                        INSERT INTO users 
                        (email, name, phone, country, state, password)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (
                        profile.email, profile.name, profile.phone,
                        profile.country, profile.state, hashed_password
                    ))
                    user_id = cursor.lastrowid
                except MySQLError as e:
                    if e.errno == 1062:  # MySQL duplicate entry error
                        logger.error(f"Duplicate email error: {profile.email}")
                        raise HTTPException(status_code=409, detail="Email already exists")
                    logger.error(f"Error creating user: {e}")
                    raise HTTPException(status_code=500, detail=f"Error creating user profile: {str(e)}")

            conn.commit()
            logger.info(f"Database changes committed for user: {profile.email}")

            # Get updated user data
            cursor.execute("""
                SELECT id, email, name, phone, country, state,
                       created_at, last_active
                FROM users WHERE id = %s
            """, (user_id,))
            
            user_data = cursor.fetchone()
            if not user_data:
                logger.error(f"User data not found after creation/update: {profile.email}")
                raise HTTPException(status_code=500, detail="Error retrieving user data")
                
            logger.info(f"Retrieved user data: {user_data['email']}")

            # Create access token
            try:
                access_token = create_access_token({"sub": profile.email})
                logger.info(f"Created access token for user: {profile.email}")
            except Exception as e:
                logger.error(f"Error creating access token: {e}")
                raise HTTPException(status_code=500, detail="Error creating access token")

            return {
                **user_data,
                'created_at': user_data['created_at'].isoformat(),
                'last_active': user_data['last_active'].isoformat(),
                'access_token': access_token
            }

    except MySQLError as e:
        logger.error(f"Database error creating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error creating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile/{email}", response_model=UserResponse)
async def get_profile(email: str, current_user: Dict = Depends(get_current_user)) -> Dict[str, Any]:
    """Get user profile by email (requires authentication)"""
    if current_user['sub'] != email:
        raise HTTPException(status_code=403, detail="Not authorized to access this profile")

    try:
        with get_db_cursor() as (cursor, conn):
            cursor.execute("""
                SELECT id, email, name, phone, country, state,
                       created_at, last_active
                FROM users WHERE email = %s
            """, (email,))
            
            user = cursor.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Create new access token
            access_token = create_access_token({"sub": email})

            return {
                **user,
                'created_at': user['created_at'].isoformat(),
                'last_active': user['last_active'].isoformat(),
                'access_token': access_token
            }

    except MySQLError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/profile/{email}/chat-stats")
async def get_user_chat_stats(email: str) -> Dict[str, Any]:
    """Get user's chat statistics"""
    try:
        with get_db_cursor() as (cursor, conn):
            # Check if user exists
            cursor.execute(
                "SELECT id FROM users WHERE email = %s",
                (email,)
            )
            user = cursor.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Get total chats and helpful responses
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_chats,
                    SUM(CASE WHEN is_helpful = TRUE THEN 1 ELSE 0 END) as helpful_responses
                FROM qa_pairs
                WHERE user_id = %s
            """, (user['id'],))
            stats = cursor.fetchone()

            # Get most recent sessions
            cursor.execute("""
                SELECT 
                    cs.id,
                    cs.start_time,
                    cs.end_time,
                    cs.topic,
                    COUNT(qa.id) as messages_count
                FROM chat_sessions cs
                LEFT JOIN qa_pairs qa ON qa.session_id = cs.id
                WHERE cs.user_id = %s
                GROUP BY cs.id
                ORDER BY cs.start_time DESC
                LIMIT 5
            """, (user['id'],))
            recent_sessions = cursor.fetchall()

            return {
                "total_chats": stats['total_chats'],
                "helpful_responses": stats['helpful_responses'],
                "recent_sessions": [{
                    **session,
                    'start_time': session['start_time'].isoformat(),
                    'end_time': session['end_time'].isoformat() if session['end_time'] else None
                } for session in recent_sessions]
            }

    except MySQLError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/profile", response_model=UserResponse)
async def create_or_update_profile(profile: UserProfile) -> Dict[str, Any]:
    """Create or update user profile with password"""
    logger.info(f"Attempting to create/update profile for email: {profile.email}")
    try:
        with get_db_cursor() as (cursor, conn):
            # Check if user exists
            cursor.execute(
                "SELECT id, password FROM users WHERE email = %s",
                (profile.email,)
            )
            user = cursor.fetchone()
            logger.info(f"User exists check: {'Found' if user else 'Not found'}")

            # Hash the password
            hashed_password = get_password_hash(profile.password)
            
            # Create new user
            cursor.execute("""
                INSERT INTO users 
                (email, name, phone, country, state, password)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                profile.email, profile.name, profile.phone,
                profile.country, profile.state, hashed_password
            ))
            user_id = cursor.lastrowid
            conn.commit()
            
            logger.info(f"Created new user with ID: {user_id}")

            # Get the created user data
            cursor.execute("""
                SELECT id, email, name, phone, country, state,
                       created_at, last_active
                FROM users WHERE id = %s
            """, (user_id,))
            
            user_data = cursor.fetchone()

            # Create access token
            access_token = create_access_token({"sub": profile.email})
            
            return {
                **user_data,
                'created_at': user_data['created_at'].isoformat(),
                'last_active': user_data['last_active'].isoformat(),
                'access_token': access_token
            }

    except MySQLError as e:
        logger.error(f"Database error during signup: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error during signup: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
