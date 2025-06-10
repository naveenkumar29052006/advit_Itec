import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true,
    timeout: 30000 // Increase timeout to 30 seconds
});

// Add token to request headers if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error);
        if (error.response) {
            // Server responded with error
            throw error.response.data;
        } else if (error.request) {
            // No response received
            throw new Error('No response received from server. Please check your internet connection.');
        } else {
            // Error in request setup
            throw error;
        }
    }
);

// Authentication Services
export const authService = {
    // Register new user
    signup: async (userData) => {
        try {
            // Validate required fields
            if (!userData.name) throw new Error('Name is required');
            if (!userData.phoneNumber) throw new Error('Phone number is required');
            if (!userData.email) throw new Error('Email is required');
            if (!userData.password) throw new Error('Password is required');
            
            const response = await api.post('/user/profile', {
                email: userData.email,
                name: userData.name,
                password: userData.password,
                phone: userData.phoneNumber,
                country: userData.countryName || '',
                state: userData.stateName || ''
            });

            if (response.data.access_token) {
                localStorage.setItem('token', response.data.access_token);
                if (response.data.refresh_token) {
                    localStorage.setItem('refreshToken', response.data.refresh_token);
                }
                localStorage.setItem('user', JSON.stringify(response.data));
            }
            return response.data;
        } catch (error) {
            console.error('Signup error:', error);
            throw error.response?.data?.detail || error.message || 'Registration failed';
        }
    },

    // Login user
    login: async (credentials) => {
        try {
            if (!credentials.email) throw new Error('Email is required');
            if (!credentials.password) throw new Error('Password is required');

            const response = await api.post('/user/login', {
                email: credentials.email,
                password: credentials.password
            });
            
            if (response.data?.access_token) {
                localStorage.setItem('token', response.data.access_token);
                if (response.data.refresh_token) {
                    localStorage.setItem('refreshToken', response.data.refresh_token);
                }
                localStorage.setItem('user', JSON.stringify(response.data));
                return response.data;
            }
            throw new Error('Invalid response from server');
        } catch (error) {
            console.error('Login error:', error);
            throw error.response?.data?.detail || error.message || 'Login failed';
        }
    },

    // Logout user
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    },

    // Get current user profile
    getProfile: async (email) => {
        try {
            if (!email) throw new Error('Email is required');
            const response = await api.get(`/user/profile/${email}`);
            return response.data;
        } catch (error) {
            console.error('Get profile error:', error);
            throw error.response?.data?.detail || 'Failed to get profile';
        }
    },

    // Validate token
    validateToken: async (token) => {
        try {
            const response = await api.post('/user/validate-token', { token });
            return response.data;
        } catch (error) {
            console.error('Token validation error:', error);
            throw error.response?.data?.detail || 'Token validation failed';
        }
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },
};

// Chat Services
export const chatService = {
    // Send message to chatbot
    sendMessage: async (message, email, sessionId = null) => {
        try {
            if (!message) throw new Error('Message cannot be empty');
            if (!email) throw new Error('Email is required');
            
            const payload = {
                user_query: message,
                email: email,
                session_id: sessionId
            };
            
            const response = await api.post('/chat', payload);
            if (!response.data?.response) {
                throw new Error('Invalid response from server');
            }
            
            return {
                response: response.data.response,
                session_id: response.data.session_id,
                message_id: response.data.message_id
            };
        } catch (error) {
            console.error('Chat error:', error);
            throw error.response?.data?.error || error.message || 'Failed to send message';
        }
    },

    // Get conversation history for a user
    getConversations: async (email) => {
        try {
            if (!email) throw new Error('Email is required');
            const response = await api.get(`/chat/history/${email}`);
            
            if (!response.data?.conversations) {
                throw new Error('Invalid response format');
            }

            // Transform the session-based format to frontend format
            return response.data.conversations.map(session => ({
                id: session.id,
                title: session.title,
                created_at: session.created_at,
                messages: session.messages.flatMap(msg => ([
                    {
                        id: msg.id,
                        sender: "user",
                        senderName: "You",
                        time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        content: msg.user_message
                    },
                    {
                        id: msg.id,
                        sender: "system",
                        senderName: "Chatbot",
                        time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        content: msg.bot_response
                    }
                ]))
            }));
        } catch (error) {
            console.error('Get conversations error:', error);
            throw error.response?.data?.error || error.message || 'Failed to fetch conversations';
        }
    },

    // Delete a conversation
    deleteConversation: async (sessionId) => {
        try {
            if (!sessionId) throw new Error('Session ID is required');
            const response = await api.delete(`/chat/conversation/${sessionId}`);
            return response.data;
        } catch (error) {
            console.error('Delete conversation error:', error);
            throw error.response?.data?.error || error.message || 'Failed to delete conversation';
        }
    },

    // Submit feedback
    submitFeedback: async (chatId, rating, suggestion = '') => {
        try {
            if (!chatId) throw new Error('Chat ID is required');
            if (!rating || rating < 1 || rating > 5) throw new Error('Valid rating (1-5) is required');
            
            const response = await api.post(`/chat/feedback/${chatId}`, {
                rating,
                suggestion
            });
            return response.data;
        } catch (error) {
            console.error('Feedback submission error:', error);
            throw error.response?.data?.error || error.message || 'Failed to submit feedback';
        }
    },

    // Create a new chat session
    createSession: async (email, title = 'New Chat') => {
        try {
            if (!email) throw new Error('Email is required');
            const response = await api.post('/chat/session', { 
                email,
                title 
            });
            return response.data;
        } catch (error) {
            console.error('Create session error:', error);
            throw error.response?.data?.error || error.message || 'Failed to create chat session';
        }
    }
};

// Export the api instance for other services
export default api;
