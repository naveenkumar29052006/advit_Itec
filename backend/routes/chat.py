from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from backend.services.openai_service import get_openai_response
from fastapi.logger import logger
from backend.DATABASE.database import get_db_cursor
from mysql.connector.errors import Error as MySQLError
import re

router = APIRouter()

class ChatRequest(BaseModel):
    name: str
    email: EmailStr
    message: str
    password: Optional[str] = None
    phone: Optional[int] = None
    country: Optional[str] = None
    state: Optional[str] = None
    category: Optional[str] = "general"  # Tax category

class MessageResponse(BaseModel):
    message: str
    response: str
    timestamp: str

class TaxCategory:
    GST = "gst"
    INCOME_TAX = "income_tax"
    CORPORATE_TAX = "corporate_tax"
    TAX_PLANNING = "tax_planning"
    COMPLIANCE = "compliance"
    ACCOUNTING = "accounting"
    GENERAL = "general"

def split_questions(text: str) -> List[str]:
    """Split text into multiple questions based on question marks and sentence boundaries"""
    # Split by question marks followed by spaces or end of string
    questions = re.split(r'\?(?:\s+|$)', text)
    # Remove empty strings and add question mark back
    questions = [q.strip() + '?' for q in questions if q.strip()]
    return questions

def determine_tax_category(question: str) -> str:
    """Determine the tax category based on the question content"""
    question_lower = question.lower()
    
    if any(term in question_lower for term in ["gst", "goods and service tax", "input tax", "output tax"]):
        return TaxCategory.GST
    elif any(term in question_lower for term in ["income tax", "itr", "form 16", "tds"]):
        return TaxCategory.INCOME_TAX
    elif any(term in question_lower for term in ["corporate", "company tax", "business tax"]):
        return TaxCategory.CORPORATE_TAX
    elif any(term in question_lower for term in ["plan", "saving", "deduction", "exemption"]):
        return TaxCategory.TAX_PLANNING
    elif any(term in question_lower for term in ["comply", "deadline", "file", "return"]):
        return TaxCategory.COMPLIANCE
    elif any(term in question_lower for term in ["account", "book", "record", "balance"]):
        return TaxCategory.ACCOUNTING
    else:
        return TaxCategory.GENERAL

@router.post("/")
async def chat(request: ChatRequest) -> Dict[str, Any]:
    """Handle tax and finance related chat messages"""
    try:
        with get_db_cursor() as (cursor, conn):
            # Get or create user
            cursor.execute(
                "SELECT id FROM users WHERE email = %s", 
                (request.email,)
            )
            user = cursor.fetchone()

            if not user:
                cursor.execute(
                    "INSERT INTO users (email, name, phone, country, state) VALUES (%s, %s, %s, %s, %s)", 
                    (request.email, request.name, request.phone, request.country, request.state)
                )
                conn.commit()
                user_id = cursor.lastrowid
            else:
                user_id = user['id']

            # Get or create active chat session
            cursor.execute(
                """
                SELECT id FROM chat_sessions 
                WHERE user_id = %s AND end_time IS NULL
                ORDER BY start_time DESC LIMIT 1
                """,
                (user_id,)
            )
            session = cursor.fetchone()

            if not session:
                cursor.execute(
                    "INSERT INTO chat_sessions (user_id, topic) VALUES (%s, %s)",
                    (user_id, "Tax Consultation")
                )
                conn.commit()
                session_id = cursor.lastrowid
            else:
                session_id = session['id']

            # Split the message into individual questions
            questions = split_questions(request.message)
            all_responses = []

            try:
                for question in questions:
                    # Determine tax category
                    category = determine_tax_category(question)
                    
                    # Get AI response for each question
                    ai_response = await get_openai_response(question)
                    all_responses.append({
                        "question": question, 
                        "answer": ai_response,
                        "category": category
                    })
                    
                    # Store in qa_pairs table with category
                    cursor.execute(
                        """
                        INSERT INTO qa_pairs 
                        (user_id, session_id, question, answer, category) 
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (user_id, session_id, question, ai_response, category)
                    )
                
                conn.commit()

                # Format combined response
                combined_response = "\n\n".join([
                    f"Category: {qa['category'].upper()}\nQ: {qa['question']}\nA: {qa['answer']}"
                    for qa in all_responses
                ])

                return {
                    "status": "success",
                    "response": combined_response,
                    "session_id": session_id,
                    "qa_pairs": all_responses
                }

            except Exception as e:
                # Rollback in case of error
                conn.rollback()
                logger.error(f"Error in tax chat processing: {e}")
                return {
                    "status": "error",
                    "response": "I apologize, but I encountered an error processing your tax-related query. Please try again.",
                    "error": str(e)
                }

    except MySQLError as e:
        logger.error(f"Database error in tax chat: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        logger.error(f"Error processing tax chat request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{email}")
async def get_chat_history(email: str) -> Dict[str, List[Dict[str, Any]]]:
    """
    Retrieve chat history for a user from qa_pairs table
    """
    try:
        with get_db_cursor() as (cursor, conn):
            cursor.execute("""
                SELECT 
                    q.question,
                    q.answer,
                    q.created_at as timestamp,
                    q.category,
                    q.is_helpful
                FROM qa_pairs q
                JOIN users u ON u.id = q.user_id
                WHERE u.email = %s
                ORDER BY q.created_at DESC
            """, (email,))
            
            history = cursor.fetchall()
            return {"history": history}

    except MySQLError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        logger.error(f"Error retrieving chat history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/feedback/{qa_id}")
async def submit_feedback(qa_id: int, is_helpful: bool) -> Dict[str, Any]:
    """Submit feedback for a Q&A pair"""
    try:
        with get_db_cursor() as (cursor, conn):
            cursor.execute(
                "UPDATE qa_pairs SET is_helpful = %s WHERE id = %s",
                (is_helpful, qa_id)
            )
            conn.commit()
            
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Q&A pair not found")
            
            return {
                "status": "success",
                "message": "Feedback submitted successfully"
            }
            
    except MySQLError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/qa/stats")
async def get_qa_stats() -> Dict[str, Any]:
    """Get statistics about tax-related Q&A interactions"""
    try:
        with get_db_cursor() as (cursor, conn):
            # Get total Q&A count
            cursor.execute("SELECT COUNT(*) as total FROM qa_pairs")
            total = cursor.fetchone()['total']

            # Get helpful Q&A count
            cursor.execute("SELECT COUNT(*) as helpful FROM qa_pairs WHERE is_helpful = TRUE")
            helpful = cursor.fetchone()['helpful']

            # Get category distribution
            cursor.execute("""
                SELECT category, COUNT(*) as count 
                FROM qa_pairs 
                GROUP BY category
                ORDER BY 
                    CASE 
                        WHEN category = 'gst' THEN 1
                        WHEN category = 'income_tax' THEN 2
                        WHEN category = 'corporate_tax' THEN 3
                        WHEN category = 'tax_planning' THEN 4
                        WHEN category = 'compliance' THEN 5
                        WHEN category = 'accounting' THEN 6
                        ELSE 7
                    END
            """)
            categories = cursor.fetchall()

            # Get last 7 days activity
            cursor.execute("""
                SELECT DATE(created_at) as date, COUNT(*) as count,
                       SUM(CASE WHEN category = 'gst' THEN 1 ELSE 0 END) as gst_queries,
                       SUM(CASE WHEN category = 'income_tax' THEN 1 ELSE 0 END) as income_tax_queries,
                       SUM(CASE WHEN category = 'corporate_tax' THEN 1 ELSE 0 END) as corporate_tax_queries
                FROM qa_pairs
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            """)
            daily_activity = cursor.fetchall()

            # Get most common tax-related queries
            cursor.execute("""
                SELECT category, question, COUNT(*) as frequency
                FROM qa_pairs
                GROUP BY category, question
                HAVING COUNT(*) > 1
                ORDER BY COUNT(*) DESC
                LIMIT 10
            """)
            common_queries = cursor.fetchall()

            return {
                "total_qa_pairs": total,
                "helpful_responses": helpful,
                "helpful_percentage": (helpful / total * 100) if total > 0 else 0,
                "categories": categories,
                "daily_activity": daily_activity
            }

    except MySQLError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        logger.error(f"Error getting Q&A stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/qa/search")
async def search_qa(
    query: str = Query(None, description="Search term for Q&A pairs"),
    category: str = Query(None, description="Filter by category"),
    helpful: bool = Query(None, description="Filter by helpful status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page")
) -> Dict[str, Any]:
    """Search Q&A pairs with filters and pagination"""
    try:
        with get_db_cursor() as (cursor, conn):
            # Build the WHERE clause based on filters
            where_clauses = []
            params = []
            
            if query:
                where_clauses.append("(question LIKE %s OR answer LIKE %s)")
                params.extend([f"%{query}%", f"%{query}%"])
            
            if category:
                where_clauses.append("category = %s")
                params.append(category)
            
            if helpful is not None:
                where_clauses.append("is_helpful = %s")
                params.append(helpful)

            # Calculate offset
            offset = (page - 1) * page_size
            
            # Construct the final query
            where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
            
            # Get total count
            count_sql = f"SELECT COUNT(*) as total FROM qa_pairs WHERE {where_sql}"
            cursor.execute(count_sql, params)
            total = cursor.fetchone()['total']

            # Get paginated results
            sql = f"""
                SELECT 
                    qa.id,
                    qa.question,
                    qa.answer,
                    qa.category,
                    qa.is_helpful,
                    qa.created_at,
                    u.email as user_email
                FROM qa_pairs qa
                JOIN users u ON u.id = qa.user_id
                WHERE {where_sql}
                ORDER BY qa.created_at DESC
                LIMIT %s OFFSET %s
            """
            cursor.execute(sql, params + [page_size, offset])
            results = cursor.fetchall()

            return {
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size,
                "results": results
            }

    except MySQLError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        logger.error(f"Error searching Q&A: {e}")
        raise HTTPException(status_code=500, detail=str(e))
