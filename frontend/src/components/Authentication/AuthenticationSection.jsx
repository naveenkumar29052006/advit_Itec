import { useState } from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

/**
 * AuthenticationSection Component
 * 
 * Container for authentication forms with ability to switch between login and signup.
 * Manages which form is currently displayed and passes authentication callbacks.
 * 
 * @param {Function} onLogin - Callback for successful login
 * @param {Function} onSignup - Callback for successful signup
 */
const AuthenticationSection = ({ onLogin, onSignup }) => {
    // Track which form is currently displayed (login or signup)
    const [isLoginForm, setIsLoginForm] = useState(true);

    /**
     * Switch between login and signup forms
     */
    const toggleForm = () => {
        setIsLoginForm(!isLoginForm);
    };

    return (
        <div className="authentication-section">
            {isLoginForm ? (
                // Show login form by default
                <LoginForm onLogin={onLogin} toggleForm={toggleForm} />
            ) : (
                // Show signup form when toggled
                <SignupForm onSignup={onSignup} toggleForm={toggleForm} />
            )}
        </div>
    );
};

export default AuthenticationSection;
