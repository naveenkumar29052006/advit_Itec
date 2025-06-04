import { CloseIcon } from "../icons/Icons";
import Navigation from "../Navigation/Navigation";
import HomeSection from "../Sections/HomeSection";
import MessagesSection from "../Sections/MessagesSection";
import HelpSection from "../Sections/HelpSection";
import AuthenticationSection from "../Authentication/AuthenticationSection";

/**
 * ModalWindow Component
 *
 * The main container for the chat interface that handles:
 * - Section visibility based on active tab
 * - Authentication flow
 * - Header with dynamic title
 * - Navigation between sections
 */
const ModalWindow = ({
    toggleModal,
    activeTab,
    setActiveTab,
    faqData,
    messageData,
    helpData,
    isLoggedIn,
    setIsLoggedIn,
    onAuthSuccess,
    onLogout,
    user
}) => {
    /**
     * Handle successful login
     * @param {Object} data - User credentials
     */
    const handleLogin = (data) => {
        onAuthSuccess(data);
    };

    /**
     * Handle successful account creation
     * @param {Object} data - New user information
     */
    const handleSignup = (data) => {
        console.log("Signup successful with:", data);
        setIsLoggedIn(true);
        setActiveTab("home"); // Redirect to home after signup
        // In production: Call API to create account and handle the response
    };

    // Security: Redirect to home if trying to access restricted content
    if (!isLoggedIn && activeTab === "messages") {
        setActiveTab("home");
    }

    // If user is logged in and activeTab is 'auth', redirect to home
    if (isLoggedIn && activeTab === "auth") {
        setActiveTab("home");
    }

    return (
        <div className="modal-overlay">
            <div className="modal-window">
                {/* Header with dynamic title based on current section */}
                <div className="modal-header">
                    <h2 className="modal-title">
                        {activeTab === "home" && "Home"}
                        {activeTab === "messages" && "Messages"}
                        {activeTab === "help" && "Help"}
                        {activeTab === "auth" && "Authentication"}
                    </h2>

                    <div className="header-actions">
                        {/* Conditional rendering of login/logout buttons */}
                        {!isLoggedIn ? (
                            <button
                                className="login-button"
                                onClick={() => setActiveTab("auth")}
                            >
                                Login
                            </button>
                        ) : (
                            <button
                                className="logout-button"
                                onClick={onLogout}
                                title="Logout"
                            >
                                Logout
                            </button>
                        )}

                        {/* Close window button */}
                        <button className="close-button" onClick={toggleModal}>
                            <CloseIcon />
                        </button>
                    </div>
                </div>

                {/* Content area with conditional rendering based on active tab */}
                <div className="modal-content">
                    {/* Only show AuthenticationSection if not logged in */}
                    {!isLoggedIn && activeTab === "auth" ? (
                        <AuthenticationSection
                            onLogin={handleLogin}
                            onSignup={handleLogin} // Using same handler as both should call onAuthSuccess
                        />
                    ) : (
                        <>
                            {activeTab === "home" && <HomeSection faqData={faqData} />}
                            {activeTab === "messages" && (
                                <MessagesSection
                                    messages={messageData}
                                    isLoggedIn={isLoggedIn}
                                    onAuthSuccess={onAuthSuccess}
                                />
                            )}
                            {activeTab === "help" && <HelpSection helpData={helpData} />}
                        </>
                    )}
                </div>

                {/* Bottom navigation */}
                <div className="modal-footer">
                    <Navigation
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        isLoggedIn={isLoggedIn}
                    />
                </div>
            </div>
        </div>
    );
};

export default ModalWindow;
