from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import google.generativeai as genai
from backend.database import get_db_session
from backend.models.chat import ChatHistory, Feedback, ChatSession

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

app = Flask(__name__)
CORS(app, 
     resources={r"/*": {"origins": ["http://localhost:5173"], "methods": ["GET", "POST", "DELETE", "OPTIONS"]}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization", "X-Gemini-Api-Key"])

SYSTEM_PROMPT = """You are an expert tax and finance chatbot of advit itec, specializing in GST filing, income tax, financial planning, and accounting services.\n\nGuidelines:\n1. Always respond only in English.\n2. Focus on accuracy and clarity in tax and finance-related information.\n3. Keep explanations clear, concise, and professional.\n4. For GST and tax-related queries, always mention applicable sections and rules.\n5. Break down complex financial concepts into simple steps.\n6. Provide disclaimers when necessary about consulting a qualified professional.\n7. Stay updated with current tax rates and GST slabs.\n\nKey Areas of Expertise:\n- GST Filing and Compliance\n- Income Tax Returns\n- Tax Planning and Savings\n- Financial Record Keeping\n- Business Accounting\n- Corporate Tax\n- Tax Deductions and Exemptions\n\nRemember:\n- Always provide accurate tax-related information\n- Include relevant tax laws and regulations\n- Suggest proper documentation requirements\n- Explain filing deadlines and compliance requirements\n\n**Formatting Instructions:**\n- ALWAYS use markdown for your output.\n- Use bullet points or numbered lists for all answers.\n- Add TWO line breaks between each point or paragraph for clear separation.\n- Never return a single long paragraph.\n- Never combine multiple points in one paragraph.\n- Each point must be on its own line, separated by two line breaks.\n- Use bold or italics for emphasis where appropriate.\n- Mimic the style and clarity of ChatGPT.\n\nDo not provide responses in any language other than English.\nImportant: Always include disclaimers for complex tax matters and recommend consulting a certified tax professional for specific cases."""

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_query = data.get('user_query', '')
    user_email = data.get('email', 'anonymous')
    session_id = data.get('session_id')
    
    if not user_query.strip():
        return jsonify({'error': 'user_query is required'}), 400
    
    prompt = f"{SYSTEM_PROMPT}\n\nUser: {user_query}"
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash-latest")
        response = model.generate_content(prompt)
        bot_response = response.text if hasattr(response, 'text') else str(response)
        
        # Store chat in DB
        with next(get_db_session()) as db:
            # Create new session if none exists
            if not session_id:
                session = ChatSession(user_email=user_email, title=user_query[:50] + "...")
                db.add(session)
                db.flush()  # Get the session ID
                session_id = session.id
            
            chat = ChatHistory(
                session_id=session_id,
                user_email=user_email,
                user_message=user_query,
                bot_response=bot_response
            )
            db.add(chat)
            db.commit()
            
            return jsonify({
                'response': bot_response,
                'session_id': session_id,
                'message_id': chat.id
            })
            
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/chat/history/<email>', methods=['GET'])
def chat_history(email):
    with next(get_db_session()) as db:
        sessions = db.query(ChatSession).filter(
            ChatSession.user_email == email
        ).order_by(ChatSession.created_at.desc()).all()
        
        return jsonify({'conversations': [
            {
                'id': session.id,
                'title': session.title,
                'created_at': session.created_at.isoformat(),
                'messages': [
                    {
                        'id': msg.id,
                        'user_message': msg.user_message,
                        'bot_response': msg.bot_response,
                        'created_at': msg.created_at.isoformat()
                    } for msg in session.messages
                ]
            } for session in sessions
        ]})

@app.route('/chat/conversation/<int:session_id>', methods=['DELETE'])
def delete_conversation(session_id):
    with next(get_db_session()) as db:
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if session:
            db.delete(session)  # This will cascade delete all messages
            db.commit()
            return jsonify({'status': 'deleted'})
        return jsonify({'error': 'Not found'}), 404

@app.route('/chat/feedback/<int:chat_id>', methods=['POST'])
def submit_feedback(chat_id):
    data = request.get_json()
    rating = data.get('rating')
    suggestion = data.get('suggestion')
    
    if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
        return jsonify({'error': 'Valid rating (1-5) is required'}), 400
        
    with next(get_db_session()) as db:
        # Verify chat exists
        chat = db.query(ChatHistory).filter(ChatHistory.id == chat_id).first()
        if not chat:
            return jsonify({'error': 'Chat message not found'}), 404
            
        feedback = Feedback(chat_id=chat_id, rating=rating, suggestion=suggestion)
        db.add(feedback)
        db.commit()
        return jsonify({'status': 'feedback saved'})

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def server_error(e):
    print(f"Server error: {str(e)}")
    return jsonify({'error': str(e)}), 500

@app.errorhandler(Exception)
def handle_exception(e):
    print(f"Unhandled exception: {str(e)}")
    return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
