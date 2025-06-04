/**
 * MessageList Component
 * 
 * Renders a list of messages with appropriate styling for user vs system messages.
 * Shows message sender, timestamp, and content.
 * 
 * @param {Array} messages - List of message objects to display
 */
const MessageList = ({ messages }) => (
    <div className="message-list">
        {messages.map((message, index) => (
            <div
                key={index}
                className={`message ${message.sender === "user" ? "user-message" : "system-message"}`}
            >
                {/* Message header with sender and timestamp */}
                <div className="message-header">
                    <span className="message-sender">{message.senderName}</span>
                    <span className="message-time">{message.time}</span>
                </div>

                {/* Message content */}
                <div className="message-content">{message.content}</div>
            </div>
        ))}
    </div>
);

export default MessageList;
