import { useState } from "react";
import MessageList from "../MessageList/MessageList";
import { SendIcon } from "../icons/Icons";
import AuthenticationSection from "../Authentication/AuthenticationSection";

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
const MessagesSection = ({ messages, isLoggedIn, onAuthSuccess }) => {
    // ======== STATE MANAGEMENT ========

    // Sample conversation threads with message history
    const [conversations, setConversations] = useState([
        {
            id: 1,
            title: "Account Settings Help",
            lastMessage: "What specific setting are you looking for?",
            timestamp: "10:33 AM",
            messages: [
                {
                    sender: "system",
                    senderName: "Chatbot",
                    time: "10:30 AM",
                    content: "Hello! How can I assist you today?",
                },
                {
                    sender: "user",
                    senderName: "You",
                    time: "10:32 AM",
                    content: "I need help with my account settings.",
                },
                {
                    sender: "system",
                    senderName: "Chatbot",
                    time: "10:33 AM",
                    content: "Sure, what specific setting are you looking for?",
                },
            ]
        },
        {
            id: 2,
            title: "Subscription Inquiry",
            lastMessage: "We've sent the invoice to your email.",
            timestamp: "Yesterday",
            messages: [
                {
                    sender: "system",
                    senderName: "Chatbot",
                    time: "Yesterday",
                    content: "Welcome back! How can I help you today?",
                },
                {
                    sender: "user",
                    senderName: "You",
                    time: "Yesterday",
                    content: "I'd like to know about the premium subscription options.",
                },
                {
                    sender: "system",
                    senderName: "Chatbot",
                    time: "Yesterday",
                    content: "We offer several plans starting at $9.99/month. Would you like me to send you the details?",
                },
                {
                    sender: "user",
                    senderName: "You",
                    time: "Yesterday",
                    content: "Yes please, and can you include pricing for annual plans?",
                },
                {
                    sender: "system",
                    senderName: "Chatbot",
                    time: "Yesterday",
                    content: "We've sent the invoice to your email.",
                },
            ]
        },
        {
            id: 3,
            title: "Technical Support",
            lastMessage: "The issue has been resolved.",
            timestamp: "Jun 15",
            messages: [
                {
                    sender: "system",
                    senderName: "Support Agent",
                    time: "Jun 15",
                    content: "Hello, I understand you're having technical difficulties?",
                },
                {
                    sender: "user",
                    senderName: "You",
                    time: "Jun 15",
                    content: "Yes, I can't access my reports dashboard.",
                },
                {
                    sender: "system",
                    senderName: "Support Agent",
                    time: "Jun 15",
                    content: "I'll help you troubleshoot that. Can you tell me what error message you're seeing?",
                },
                {
                    sender: "system",
                    senderName: "Support Agent",
                    time: "Jun 15",
                    content: "The issue has been resolved.",
                },
            ]
        }
    ]);

    // Currently active conversation (null when showing the conversation list)
    const [activeConversation, setActiveConversation] = useState(null);

    // New message being composed by the user
    const [newMessage, setNewMessage] = useState("");

    // ======== EVENT HANDLERS ========

    /**
     * Send a new message in the active conversation
     * Adds user message and simulates an automated response
     */
    const handleSendMessage = () => {
        // Validate input and active conversation
        if (newMessage.trim() === "" || !activeConversation) return;

        // Update conversations with the new user message
        const updatedConversations = conversations.map(conv => {
            if (conv.id === activeConversation.id) {
                // Format current time for the message timestamp
                const currentTime = new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                // Add user's message to conversation
                const updatedMessages = [
                    ...conv.messages,
                    {
                        sender: "user",
                        senderName: "You",
                        time: currentTime,
                        content: newMessage
                    }
                ];

                // Update conversation metadata
                return {
                    ...conv,
                    lastMessage: newMessage,
                    timestamp: "Just now",
                    messages: updatedMessages
                };
            }
            return conv;
        });

        // Update state and clear input field
        setConversations(updatedConversations);
        setNewMessage("");

        // Simulate automated response after a brief delay
        simulateResponse(activeConversation);
    };

    /**
     * Simulate a response from the support system
     * @param {Object} conversation - The conversation to respond to
     */
    const simulateResponse = (conversation) => {
        setTimeout(() => {
            // Create bot response
            const botResponse = {
                sender: "system",
                senderName: conversation.messages[0].senderName,
                time: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                content: "Thank you for your message. A support agent will respond shortly."
            };

            // Add response to conversation
            const updatedWithResponse = conversations.map(conv => {
                if (conv.id === conversation.id) {
                    return {
                        ...conv,
                        lastMessage: botResponse.content,
                        timestamp: "Just now",
                        messages: [...conv.messages, botResponse]
                    };
                }
                return conv;
            });

            // Update state and active conversation
            setConversations(updatedWithResponse);
            setActiveConversation(updatedWithResponse.find(c => c.id === conversation.id));
        }, 1000); // 1-second delay for realism
    };

    /**
     * Handle Enter key press in message input
     * @param {Event} e - Keyboard event
     */
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    /**
     * Create a new conversation thread
     */
    const startNewConversation = () => {
        const newConv = {
            id: Date.now(),
            title: "New Conversation",
            lastMessage: "How can we help you today?",
            timestamp: "Just now",
            messages: [{
                sender: "system",
                senderName: "Chatbot",
                time: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                content: "How can we help you today?"
            }]
        };

        // Add new conversation to the top of the list
        setConversations([newConv, ...conversations]);

        // Activate the new conversation
        setActiveConversation(newConv);
    };

    // ======== COMPONENT RENDERING ========
    if (!isLoggedIn) {
        return <AuthenticationSection onLogin={onAuthSuccess} onSignup={onAuthSuccess} />;
    }

    return (
        <div className="messages-section">
            {!activeConversation ? (
                // Conversation List View
                <div className="conversations-list">
                    <h2>Your Conversations</h2>

                    {/* List of existing conversations */}
                    <div className="conversation-items">
                        {conversations.map(conversation => (
                            <div
                                key={conversation.id}
                                className="conversation-item"
                                onClick={() => setActiveConversation(conversation)}
                            >
                                <div className="conversation-title">{conversation.title}</div>
                                <div className="conversation-preview">{conversation.lastMessage}</div>
                                <div className="conversation-timestamp">{conversation.timestamp}</div>
                            </div>
                        ))}
                    </div>

                    {/* New conversation button */}
                    <div className="new-conversation">
                        <button
                            className="new-chat-button"
                            onClick={startNewConversation}
                        >
                            Start New Chat
                        </button>
                    </div>
                </div>
            ) : (
                // Active Conversation View
                <div className="active-conversation">
                    {/* Conversation header with back button */}
                    <div className="conversation-header">
                        <button
                            className="back-button"
                            onClick={() => setActiveConversation(null)}
                        >
                            ← Back
                        </button>
                        <h3>{activeConversation.title}</h3>
                    </div>

                    {/* Message history */}
                    <MessageList messages={activeConversation.messages} />

                    {/* Message input area */}
                    <div className="message-input-container">
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
        </div>
    );
};

export default MessagesSection;
