# CA Chatbot - Tax and Finance Assistant

A full-stack chatbot application using Flask, React, and Google's Gemini AI for tax and finance assistance.

## Features

- Real-time chat interface with Gemini AI
- Session-based chat history
- User feedback system
- Email notifications
- Secure database storage
- CORS-enabled API
- Responsive frontend

## Tech Stack

### Backend
- Python 3.11+
- Flask
- SQLAlchemy
- MySQL
- Google Generative AI (Gemini)

### Frontend
- React
- Vite
- Axios
- Modern CSS

## Setup

### Backend Setup

1. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables in `.env`:
```
GEMINI_API_KEY=your_api_key
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=chatbot
DB_PORT=3306
```

4. Start the backend server:
```bash
python -m backend.server
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

## API Endpoints

- POST `/chat` - Send message to chatbot
- GET `/chat/history/<email>` - Get chat history
- DELETE `/chat/conversation/<id>` - Delete conversation
- POST `/chat/feedback/<id>` - Submit feedback

## Database Schema

- `chat_sessions` - Stores chat sessions
- `chat_history` - Stores individual messages
- `feedback` - Stores user feedback

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT License - see LICENSE file for details
