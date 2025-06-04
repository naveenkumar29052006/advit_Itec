import { useState } from "react";
import { authService } from "../../services/api";

/**
 * LoginForm Component
 * 
 * Handles user login with email and password.
 * Provides form validation and submission handling.
 * Integrates with authentication service for backend communication.
 * 
 * @param {Function} onLogin - Callback for successful login
 * @param {Function} toggleForm - Function to switch to signup form
 */

/**
 * LoginForm Component
 * 
 * Handles user login with email and password.
 * Provides form validation and submission handling.
 * 
 * @param {Function} onLogin - Callback for successful login
 * @param {Function} toggleForm - Function to switch to signup form
 */
const LoginForm = ({ onLogin, toggleForm }) => {
    // Form data state
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    
    // Loading and error states
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    /**
     * Update form data when inputs change
     * @param {Event} e - Input change event
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    /**
     * Handle form submission
     * @param {Event} e - Form submit event
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await authService.login(formData);
            onLogin(response);
        } catch (err) {
            setError(err.toString());
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-form">
            <h2>Welcome Back</h2>
            <p className="auth-subtitle">Sign in to continue</p>

            <form onSubmit={handleSubmit}>
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}
                
                {/* Email input */}
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@example.com"
                        required
                        disabled={isLoading}
                    />
                </div>

                {/* Password input */}
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        disabled={isLoading}
                    />
                </div>

                <button 
                    type="submit" 
                    className="auth-button"
                    disabled={isLoading}
                >
                    {isLoading ? "Signing in..." : "Sign In"}
                </button>
            </form>

            {/* Link to switch to signup form */}
            <p className="auth-toggle">
                Don't have an account?
                <button className="toggle-button" onClick={toggleForm}>
                    Sign Up
                </button>
            </p>
        </div>
    );
};

export default LoginForm;
