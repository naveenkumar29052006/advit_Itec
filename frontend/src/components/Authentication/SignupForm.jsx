import { useState, useEffect, useRef } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Country, State } from "country-state-city";
import { authService } from "../../services/api";
import "./SignupForm.css";

/**
 * SignupForm Component
 *
 * Comprehensive registration form with:
 * - Real-time field validation
 * - International phone number input
 * - Country and state selection
 * - Password strength requirements
 *
 * @param {Function} onSignup - Callback for successful registration
 * @param {Function} toggleForm - Function to switch to login form
 */
const SignupForm = ({ onSignup, toggleForm }) => {
    // ======== STATE MANAGEMENT ========

    // Main form data state
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        phoneNumber: "",
        phoneCountryCode: "", // Separate phone country code
        phoneCountryName: "", // Separate phone country name
        countryCode: "", // This is for location
        countryName: "", // This is for location
        stateCode: "",
        stateName: "",
        password: "",
        confirmPassword: "",
    });

    // Validation error messages
    const [errors, setErrors] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        username: "",
        country: "",
        state: "",
    });

    // Location data from external library
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);

    // Loading state for form submission
    const [isLoading, setIsLoading] = useState(false);

    // For custom country code dropdown
    const [phoneCountrySearch, setPhoneCountrySearch] = useState("");
    const [showPhoneCountryModal, setShowPhoneCountryModal] = useState(false);
    const phoneCountryModalRef = useRef(null);

    // For location country dropdown
    const [locationCountrySearch, setLocationCountrySearch] = useState("");
    const [showLocationCountryModal, setShowLocationCountryModal] = useState(false);
    const locationCountryModalRef = useRef(null);

    // Filtered countries for search
    const filteredPhoneCountries = countries.filter(
      (country) =>
        country.name.toLowerCase().includes(phoneCountrySearch.toLowerCase()) ||
        country.phonecode.includes(phoneCountrySearch) ||
        country.isoCode.toLowerCase().includes(phoneCountrySearch.toLowerCase())
    );

    const filteredLocationCountries = countries.filter(
      (country) =>
        country.name.toLowerCase().includes(locationCountrySearch.toLowerCase()) ||
        country.isoCode.toLowerCase().includes(locationCountrySearch.toLowerCase())
    );

    // ======== DATA LOADING ========

    // Load all countries on component mount
    useEffect(() => {
        const allCountries = Country.getAllCountries();
        setCountries(allCountries);
    }, []);

    // Update states list when selected country changes
    useEffect(() => {
        if (formData.countryCode) {
            const countryStates = State.getStatesOfCountry(formData.countryCode);
            setStates(countryStates);
        } else {
            setStates([]);
        }
    }, [formData.countryCode]);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (showPhoneCountryModal && 
            phoneCountryModalRef.current && 
            !phoneCountryModalRef.current.contains(event.target)) {
          setShowPhoneCountryModal(false);
        }
        if (showLocationCountryModal && 
            locationCountryModalRef.current && 
            !locationCountryModalRef.current.contains(event.target)) {
          setShowLocationCountryModal(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [showPhoneCountryModal, showLocationCountryModal]);

    // ======== EVENT HANDLERS ========

    /**
     * Handle form field changes with real-time validation
     * @param {Event} e - Input change event
     */
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Update form data
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Handle special field validations
        if (name === "email") {
            validateEmailField(value);
        } else if (name === "password") {
            validatePasswordField(value);
            validatePasswordMatch(value, formData.confirmPassword);
        } else if (name === "confirmPassword") {
            validatePasswordMatch(formData.password, value);
        }

        // Handle location field changes
        if (name === "countryCode") {
            handleCountryChange(value);
        } else if (name === "stateCode") {
            handleStateChange(value);
        }
    };

    /**
     * Handle phone input changes (from PhoneInput component)
     * @param {string} value - Phone number with country code
     * @param {Object} data - Additional phone metadata from the library
     */
    const handlePhoneChange = (value, data) => {
        setFormData((prev) => ({
            ...prev,
            phoneNumber: value,
        }));
        
        // Validate phone number
        if (!value) {
            setErrors(prev => ({ ...prev, phone: "Phone number is required" }));
        } else if (value.length < 10) {
            setErrors(prev => ({ ...prev, phone: "Please enter a valid phone number" }));
        } else {
            setErrors(prev => ({ ...prev, phone: "" }));
        }
    };

    /**
     * Update country selection and reset state
     * @param {string} countryCode - Selected country code
     */
    const handleCountryChange = (countryCode) => {
        const selectedCountry = countries.find(
            (country) => country.isoCode === countryCode
        );

        setFormData((prev) => ({
            ...prev,
            countryCode: countryCode,
            countryName: selectedCountry?.name || "",
            stateCode: "",
            stateName: "",
        }));
    };

    /**
     * Update state selection
     * @param {string} stateCode - Selected state code
     */
    const handleStateChange = (stateCode) => {
        const selectedState = states.find((state) => state.isoCode === stateCode);

        setFormData((prev) => ({
            ...prev,
            stateCode: stateCode,
            stateName: selectedState?.name || "",
        }));
    };

    // Handle location country selection
    const handleLocationCountrySelect = (country) => {
        setFormData(prev => ({
            ...prev,
            countryCode: country.isoCode,
            countryName: country.name,
            stateCode: "",
            stateName: ""
        }));
        setLocationCountrySearch("");
        setShowLocationCountryModal(false);
    };

    // ======== VALIDATION FUNCTIONS ========

    /**
     * Validate email format and update error state
     * @param {string} email - Email to validate
     * @returns {boolean} Whether email is valid
     */
    const validateEmailField = (email) => {
        if (!email) return true;

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const isValid = emailRegex.test(email);

        setErrors((prev) => ({
            ...prev,
            email: isValid ? "" : "Please enter a valid email address",
        }));

        return isValid;
    };

    /**
     * Validate password meets security requirements
     * @param {string} password - Password to validate
     * @returns {boolean} Whether password meets all requirements
     */
    const validatePasswordField = (password) => {
        if (!password) {
            setErrors((prev) => ({ ...prev, password: "" }));
            return true;
        }

        // Check security requirements
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

        // Build error message for missing requirements
        let errorMessage = "";
        if (!hasUpperCase) errorMessage += "• Missing uppercase letter\n";
        if (!hasLowerCase) errorMessage += "• Missing lowercase letter\n";
        if (!hasNumber) errorMessage += "• Missing number\n";
        if (!hasSpecialChar) errorMessage += "• Missing special character\n";

        const isValid = hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

        setErrors((prev) => ({
            ...prev,
            password: errorMessage,
        }));

        return isValid;
    };

    /**
     * Check if passwords match
     * @param {string} password - Original password
     * @param {string} confirmPassword - Confirmation password
     * @returns {boolean} Whether passwords match
     */
    const validatePasswordMatch = (password, confirmPassword) => {
        if (!confirmPassword) return true;

        const isMatch = password === confirmPassword;

        setErrors((prev) => ({
            ...prev,
            confirmPassword: isMatch ? "" : "Passwords do not match",
        }));

        return isMatch;
    };

    /**
     * Validate all form fields before submission
     * @returns {boolean} Whether the entire form is valid
     */
    const validateForm = () => {
        const newErrors = {};

        // Required fields validation
        if (!formData.username.trim()) {
            newErrors.username = "Name is required";
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!validateEmailField(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        // Phone validation
        if (!formData.phoneNumber) {
            newErrors.phone = "Phone number is required";
        } else if (formData.phoneNumber.length < 10) {
            newErrors.phone = "Please enter a valid phone number";
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (!validatePasswordField(formData.password)) {
            newErrors.password =
                "Password must have uppercase, lowercase, number, and special character";
        }

        // Password match validation
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        // Country validation
        if (!formData.countryCode) {
            newErrors.country = "Country is required";
        }

        // State validation
        if (formData.countryCode && !formData.stateCode) {
            newErrors.state = "State/Province is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * Handle form submission
     * @param {Event} e - Form submit event
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all fields before submission
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            // Format data for backend
            const userData = {
                email: formData.email,
                name: formData.username,
                password: formData.password,
                phoneNumber: formData.phoneNumber, // ensure this matches api.js validation
                countryName: formData.countryName,
                stateName: formData.stateName
            };

            const response = await authService.signup(userData);
            
            // Clear any existing errors
            setErrors({});
            
            // Call the onSignup callback with the response data
            onSignup(response);
            
        } catch (error) {
            console.error('Signup error:', error);
            setErrors((prev) => ({
                ...prev,
                submit: typeof error === 'string' ? error : 'Registration failed. Please try again.',
            }));
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to get country dial code by isoCode
    const getCountryDialCode = (isoCode) => {
        const country = countries.find(c => c.isoCode === isoCode);
        return country ? `+${country.phonecode}` : '';
    };

    // Helper to get flag emoji from country code
    const getFlagEmoji = (countryCode) => {
      if (!countryCode) return "";
      return countryCode
        .toUpperCase()
        .replace(/./g, (char) =>
          String.fromCodePoint(127397 + char.charCodeAt())
        );
    };

    // ======== COMPONENT RENDERING ========
    return (
        <div className="auth-form">
            <h2>Create Account</h2>
            <p className="auth-subtitle">Sign up to get started</p>

            <form onSubmit={handleSubmit}>
                {/* Full Name field */}
                <div className="form-group">
                    <label htmlFor="username">Full Name *</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        required
                    />
                    {errors.username && (
                        <span className="error-message">{errors.username}</span>
                    )}
                </div>

                {/* Email field with validation */}
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
                    />
                    {errors.email && formData.email && (
                        <span className="error-message">{errors.email}</span>
                    )}
                </div>

                {/* Phone number with popup country code selector */}
                <div className="form-group phone-group">
                  <div className="country-code-box" onClick={() => setShowPhoneCountryModal(true)}>
                    <span className="country-flag">
                      {formData.phoneCountryCode ? getFlagEmoji(formData.phoneCountryCode) : '🌐'}
                    </span>
                    <span className="country-code-value">
                      {formData.phoneCountryCode ? 
                        `+${countries.find(c => c.isoCode === formData.phoneCountryCode)?.phonecode || '00'}` : 
                        '+00'}
                    </span>
                  </div>
                  
                  <div className="phone-number-box">
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="Phone number"
                      required
                      maxLength={20}
                    />
                  </div>
                </div>

                {/* Country Code Selection Modal */}
                {showPhoneCountryModal && (
                  <div className="country-code-modal-overlay">
                    <div className="country-code-modal" ref={phoneCountryModalRef}>
                      <div className="modal-header">
                        <h3>Select Country Code</h3>
                        <input
                          type="text"
                          placeholder="Search country or code..."
                          value={phoneCountrySearch}
                          onChange={(e) => setPhoneCountrySearch(e.target.value)}
                          className="country-search-input"
                        />
                      </div>
                      <div className="country-list">
                        {filteredPhoneCountries.map((country) => (
                          <div
                            key={country.isoCode}
                            className="country-item"
                            onClick={() => {
                              const phoneWithoutCode = formData.phoneNumber.replace(/^\+\d+/, '').replace(/^0+/, '');
                              setFormData(prev => ({
                                ...prev,
                                phoneCountryCode: country.isoCode,
                                phoneCountryName: country.name,
                                phoneNumber: `+${country.phonecode}${phoneWithoutCode}`
                              }));
                              setShowPhoneCountryModal(false);
                              setPhoneCountrySearch("");
                            }}
                          >
                            <span>{country.name}</span>
                            <span>+{country.phonecode}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {errors.phone && (
                  <span className="error-message">{errors.phone}</span>
                )}

                {/* Country and State selection */}
                <div className="location-fields">
                    <div className="form-group">
                        <label htmlFor="countryCode">Country</label>
                        <div className="custom-select-wrapper">
                          <div 
                            className="selected-country" 
                            onClick={() => setShowLocationCountryModal(true)}
                          >
                            <span className="flag-emoji">
                              {formData.countryCode ? getFlagEmoji(formData.countryCode) : '🌐'}
                            </span>
                            <span className="country-name">
                              {formData.countryName || 'Select Country'}
                            </span>
                          </div>
                          {showLocationCountryModal && (
                            <div className="country-modal">
                              <input
                                type="text"
                                value={locationCountrySearch}
                                onChange={(e) => setLocationCountrySearch(e.target.value)}
                                placeholder="Search country..."
                                className="country-search-input"
                                autoFocus
                              />
                              <div className="country-list" ref={locationCountryModalRef}>
                                {filteredLocationCountries.length === 0 ? (
                                  <div className="no-results">No results found</div>
                                ) : (
                                  filteredLocationCountries.map((country) => (
                                    <div
                                      key={country.isoCode}
                                      className="country-item"
                                      onClick={() => {
                                        handleLocationCountrySelect(country);
                                      }}
                                    >
                                      <span className="flag-emoji">{getFlagEmoji(country.isoCode)}</span>
                                      <span className="country-name">{country.name}</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="stateCode">State/Province</label>
                        <select
                            id="stateCode"
                            name="stateCode"
                            value={formData.stateCode}
                            onChange={handleChange}
                            required
                            disabled={!formData.countryCode}
                        >
                            <option value="">Select State</option>
                            {states.map((state) => (
                                <option key={state.isoCode} value={state.isoCode}>
                                    {state.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Password with security requirements */}
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a password"
                        required
                    />
                    {errors.password && formData.password && (
                        <div className="error-message password-requirements">
                            <p>Password must contain:</p>
                            {errors.password
                                .split("\n")
                                .filter(Boolean)
                                .map((error, index) => (
                                    <div key={index}>{error}</div>
                                ))}
                        </div>
                    )}
                </div>

                {/* Confirm password */}
                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        required
                    />
                    {errors.confirmPassword && formData.confirmPassword && (
                        <span className="error-message">{errors.confirmPassword}</span>
                    )}
                </div>

                {/* Submit button */}
                <button type="submit" className="auth-button" disabled={isLoading}>
                    {isLoading ? "Signing Up..." : "Sign Up"}
                </button>

                {/* Submission error message */}
                {errors.submit && (
                    <div className="error-message submit-error">
                        <strong>Error:</strong> {errors.submit}
                    </div>
                )}
            </form>

            {/* Link to switch to login form */}
            <p className="auth-toggle">
                Already have an account?
                <button className="toggle-button" onClick={toggleForm}>
                    Sign In
                </button>
            </p>
        </div>
    );
};

export default SignupForm;
