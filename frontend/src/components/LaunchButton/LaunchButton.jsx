import { ChatbotIcon } from "../icons/Icons";

/**
 * LaunchButton Component
 * 
 * Floating action button that opens the chat interface.
 * Fixed position in the bottom-right corner of the window.
 * 
 * @param {Function} onClick - Function to call when button is clicked
 */
const LaunchButton = ({ onClick }) => (
    <button className="launch-button" onClick={onClick} aria-label="Open chat">
        <ChatbotIcon />
    </button>
);

export default LaunchButton;
