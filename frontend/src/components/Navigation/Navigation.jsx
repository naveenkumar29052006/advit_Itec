import { HomeIcon, MessagesIcon, HelpIcon } from "../icons/Icons";

/**
 * Navigation Component
 * 
 * Bottom navigation bar with access control for restricted sections.
 * Controls tab switching and handles authentication requirements.
 * 
 * @param {string} activeTab - Currently selected tab
 * @param {Function} setActiveTab - Function to change active tab
 * @param {boolean} isLoggedIn - Authentication status
 */
const Navigation = ({ activeTab, setActiveTab, isLoggedIn }) => {
    /**
     * Handle tab change with access control
     * Redirects to auth if trying to access protected sections
     * 
     * @param {string} tabName - Name of tab to navigate to
     */
    const handleTabChange = (tabName) => {
        // Check if user has access to requested section
        if (tabName === "messages" && !isLoggedIn) {
            // Redirect to authentication when trying to access restricted content
            setActiveTab("auth");
        } else {
            setActiveTab(tabName);
        }
    };

    return (
        <div className="bottom-navigation">
            {/* Home tab - Available to all users */}
            <button
                className={`nav-item ${activeTab === "home" ? "active" : ""}`}
                onClick={() => handleTabChange("home")}
                title="Home"
            >
                <HomeIcon />
                <span className="nav-tooltip">Home</span>
            </button>

            {/* Messages tab - Restricted to authenticated users */}
            <button
                className={`nav-item ${activeTab === "messages" ? "active" : ""} ${!isLoggedIn ? "restricted" : ""}`}
                onClick={() => handleTabChange("messages")}
                title={isLoggedIn ? "Messages" : "Login required"}
            >
                <MessagesIcon />
                <span className="nav-tooltip">{isLoggedIn ? "Messages" : "Login required"}</span>
            </button>

            {/* Help tab - Available to all users */}
            <button
                className={`nav-item ${activeTab === "help" ? "active" : ""}`}
                onClick={() => handleTabChange("help")}
                title="Help"
            >
                <HelpIcon />
                <span className="nav-tooltip">Help</span>
            </button>
        </div>
    );
};

export default Navigation;
