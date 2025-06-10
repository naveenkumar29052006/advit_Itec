import { useState, useEffect, useRef } from "react";
import MessageList from "../MessageList/MessageList";
import { SendIcon } from "../icons/Icons";
import AuthenticationSection from "../Authentication/AuthenticationSection";
import { chatService } from "../../services/api";

/**
 * MessagesSection Component
 * 
 * Handles chat conversations with support agents or chatbot.
 * Features:
 * - List of past conversations
 * - Active conversation view with message history
 * - Message input and sending
 * - Starting new conversations
 * 
 * @param {Array} messages - Legacy parameter, now using state-based conversations
 */
const MessagesSection = ({ isLoggedIn, onAuthSuccess }) => {
    // State for all conversations
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [isBotTyping, setIsBotTyping] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [pendingQaId, setPendingQaId] = useState(null);
    const [rating, setRating] = useState(0);
    const [suggestion, setSuggestion] = useState("");
    const messageListRef = useRef(null);

    useEffect(() => {
        if (isLoggedIn) {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user?.email) {
                chatService.getConversations(user.email)
                    .then((data) => {
                        setConversations(data || []);
                        if (data && data.length > 0) {
                            setActiveConversation(data[0]);
                        }
                    })
                    .catch((error) => {
                        console.error('Error fetching conversations:', error);
                        setConversations([]);
                        setActiveConversation(null);
                    });
            }
        }
    }, [isLoggedIn]);

    useEffect(() => {
        if (activeConversation && messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [activeConversation?.messages?.length, isBotTyping]);

    const handleSendMessage = async () => {
        if (newMessage.trim() === "" || !activeConversation) return;
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userEmail = user?.email;
        
        if (!userEmail) {
            alert('Please log in to send messages');
            return;
        }

        const userMessage = {
            sender: "user",
            senderName: "You",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            content: newMessage
        };

        // Update UI immediately with user message
        setConversations(convs => {
            const updated = convs.map(conv =>
                conv.id === activeConversation.id ? {
                    ...conv,
                    messages: [...conv.messages, userMessage]
                } : conv
            );
            setActiveConversation(updated.find(c => c.id === activeConversation.id));
            return updated;
        });

        setNewMessage("");
        setIsBotTyping(true);

        try {
            const response = await chatService.sendMessage(
                newMessage, 
                userEmail,
                activeConversation.id
            );
            
            setIsBotTyping(false);
            
            const botResponse = {
                sender: "system",
                senderName: "Chatbot",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                content: response.response,
                id: response.message_id
            };

            // Update conversation with bot response and session ID if new
            setConversations(convs => {
                const updated = convs.map(conv =>
                    conv.id === activeConversation.id ? {
                        ...conv,
                        id: conv.id || response.session_id,
                        messages: [...conv.messages, botResponse]
                    } : conv
                );
                setActiveConversation(updated.find(c => c.id === (activeConversation.id || response.session_id)));
                return updated;
            });

            // Set pending QA ID for feedback
            setPendingQaId(response.message_id);
            
            // Show feedback modal after delay
            setTimeout(() => {
                setShowFeedback(true);
            }, 20000);
        } catch (error) {
            setIsBotTyping(false);
            console.error('Chat error:', error);
            const errorMessage = {
                sender: "system",
                senderName: "Chatbot",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                content: error.message || "Sorry, I encountered an error. Please try again."
            };

            setConversations(convs => {
                const updated = convs.map(conv =>
                    conv.id === activeConversation.id ? {
                        ...conv,
                        messages: [...conv.messages, errorMessage]
                    } : conv
                );
                setActiveConversation(updated.find(c => c.id === activeConversation.id));
                return updated;
            });
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const startNewConversation = async () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userEmail = user?.email;
        if (!userEmail) {
            alert('Please log in to start a new chat');
            return;
        }

        try {
            const newConv = {
                id: null,  // Will be set after first message
                title: 'New Chat',
                messages: [{
                    sender: "system",
                    senderName: "Chatbot",
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    content: "Welcome to Advit iTec chat support! How may I help you today?"
                }]
            };

            setConversations(prev => [newConv, ...prev]);
            setActiveConversation(newConv);
            setNewMessage("");
        } catch (error) {
            console.error('Error starting new chat:', error);
            alert("Failed to start a new chat. Please try again.");
        }
    };

    const handleDeleteConversation = async (conversationId) => {
        try {
            await chatService.deleteConversation(conversationId);
            setConversations(convs => convs.filter(conv => conv.id !== conversationId));
            if (activeConversation && activeConversation.id === conversationId) {
                setActiveConversation(null);
            }
        } catch (error) {
            alert(error);
        }
    };

    // Submit feedback for the last bot response
    const handleFeedbackSubmit = async () => {
        if (!pendingQaId || rating === 0) {
            alert("Please select a rating before submitting.");
            return;
        }
        try {
            await chatService.submitFeedback(pendingQaId, rating, suggestion);
            setShowFeedback(false);
            setRating(0);
            setSuggestion("");
            setPendingQaId(null);
            alert("Thank you for your feedback!");
        } catch (error) {
            alert(error || "Failed to submit feedback. Please try again.");
        }
    };

    // Handler to email chat history for the active conversation
    const handleEmailHistory = async () => {
        if (!activeConversation) return;
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userEmail = user?.email;
        if (!userEmail) {
            alert('Please log in to email chat history.');
            return;
        }
        try {
            await chatService.emailChatHistory(userEmail, activeConversation.id);
            alert('Chat history emailed successfully!');
        } catch (error) {
            alert(error || 'Failed to email chat history.');
        }
    };

    if (!isLoggedIn) {
        return <AuthenticationSection onLogin={onAuthSuccess} onSignup={onAuthSuccess} />;
    }

    const fadeClass = "fade-in-section";

    return (
        <div className={`messages-section ${fadeClass}`}>
            {!activeConversation ? (
                <div className={`conversations-list ${fadeClass}`}>
                    <h2>Your Conversations</h2>
                    <div className="conversation-items">
                        {conversations.map(conversation => (
                            <div
                                key={conversation.id}
                                className={`conversation-item ${fadeClass}`}
                                onClick={() => setActiveConversation(conversation)}
                            >
                                <div className="conversation-title">{conversation.title}</div>
                                <div className="conversation-preview">{conversation.messages.length > 0 ? conversation.messages[conversation.messages.length-1].content : ''}</div>
                                <button
                                    className="delete-conversation-button"
                                    onClick={e => { e.stopPropagation(); handleDeleteConversation(conversation.id); }}
                                    style={{ marginLeft: 8, color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                                    title="Delete conversation"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="new-conversation">
                        <button
                            className={`new-chat-button ${fadeClass}`}
                            onClick={startNewConversation}
                        >
                            Start New Chat
                        </button>
                    </div>
                </div>
            ) : (
                <div className={`active-conversation ${fadeClass}`}>
                    <div className="conversation-header">
                        <button
                            className="back-button"
                            onClick={() => setActiveConversation(null)}
                        >
                            ← Back
                        </button>
                        <h3>{activeConversation.title}</h3>
                        {/* Show email status if available */}
                        {typeof activeConversation.email_status !== 'undefined' && (
                            <span style={{ marginLeft: 16, fontSize: 14, color: activeConversation.email_status === 1 ? 'green' : '#999' }}>
                                {activeConversation.email_status === 1 ? '📧 Emailed' : 'Not emailed'}
                            </span>
                        )}
                    </div>
                    <div className="message-list animated-message-list" ref={messageListRef}>
                        <MessageList 
                            messages={activeConversation.messages} 
                            onEmailHistory={handleEmailHistory}
                        />
                        {isBotTyping && (
                            <div className="bot-typing-indicator">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </div>
                        )}
                    </div>
                    <div className="message-input-container animated-input" style={{ position: 'sticky', bottom: 0, background: '#fff', zIndex: 2, paddingTop: 10 }}>
                        <input
                            type="text"
                            placeholder="Type your message..."
                            className="message-input"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                        <button className="send-button" onClick={handleSendMessage}>
                            <SendIcon />
                        </button>
                    </div>
                </div>
            )}
            {showFeedback && (
                <div className="feedback-modal">
                    <div className="feedback-content">
                        <h4>Rate this answer</h4>
                        <div className="star-rating">
                            {[1,2,3,4,5].map(star => (
                                <span
                                    key={star}
                                    className={star <= rating ? 'star filled' : 'star'}
                                    onClick={() => setRating(star)}
                                    style={{ cursor: 'pointer', fontSize: 24 }}
                                >★</span>
                            ))}
                        </div>
                        <textarea
                            placeholder="Any suggestions? (optional)"
                            value={suggestion}
                            onChange={e => setSuggestion(e.target.value)}
                            style={{ width: '100%', marginTop: 8 }}
                        />
                        <button onClick={handleFeedbackSubmit} style={{ marginTop: 8 }}>
                            Submit Feedback
                        </button>
                        <button onClick={() => setShowFeedback(false)} style={{ marginLeft: 8 }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessagesSection;
