import { useState } from "react";

/**
 * MessageList Component
 * 
 * Renders a list of messages with appropriate styling for user vs system messages.
 * Shows message sender, timestamp, and content.
 * 
 * @param {Array} messages - List of message objects to display
 */
const MessageList = ({ messages, onEmailHistory }) => {
    // Track which message is expanded
    const [expandedIndex, setExpandedIndex] = useState(null);

    // Helper to get first 3 lines
    const getFirst3Lines = (text) => {
        const lines = text.split(/\r?\n/);
        if (lines.length <= 3) return text;
        return lines.slice(0, 3).join("\n");
    };

    return (
        <div className="message-list">
            {Array.isArray(messages) && messages.filter(
                m => m && typeof m.content === 'string' && m.content.trim() !== '' && m.senderName
            ).map((message, index) => {
                const isSystem = message.sender === "system";
                const lines = message.content.split(/\r?\n/);
                const isLong = isSystem && lines.length > 3;
                const showFull = expandedIndex === index;
                return (
                    <div
                        key={index}
                        className={`message ${message.sender === "user" ? "user-message" : "system-message"}`}
                    >
                        {/* Message header with sender and timestamp */}
                        <div className="message-header">
                            <span className="message-sender">{message.senderName}</span>
                            <span className="message-time">{message.time}</span>
                        </div>
                        {/* Message content with Read More */}
                        <div className="message-content">
                            {isLong && !showFull
                                ? <>
                                    {getFirst3Lines(message.content)}
                                    <span style={{ color: '#007bff', cursor: 'pointer', marginLeft: 8 }} onClick={() => setExpandedIndex(index)}>
                                        ...Read more
                                    </span>
                                </>
                                : message.content
                            }
                            {isLong && showFull && (
                                <span style={{ color: '#007bff', cursor: 'pointer', marginLeft: 8 }} onClick={() => setExpandedIndex(null)}>
                                    Show less
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
            {/* Email chat history button (shown if onEmailHistory is provided) */}
            {onEmailHistory && (
                <button
                    className="email-history-btn"
                    style={{ marginTop: 20, alignSelf: 'flex-end', background: '#007bff', color: 'white', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer' }}
                    onClick={onEmailHistory}
                >
                    Email this chat history
                </button>
            )}
        </div>
    );
};

export default MessageList;
