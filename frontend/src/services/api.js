import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    timeout: 15000
});

// Add token to request headers if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Authentication Services
export const authService = {
    // Register new user
    signup: async (userData) => {
        try {
            // Make sure name is always provided
            if (!userData.name) {
                throw new Error('Name is required');
            }
            
            if (!userData.phoneNumber) {
                throw new Error('Phone number is required');
            }
            
            const response = await api.post('/user/profile', {
                email: userData.email,
                name: userData.name, // always send 'name' to backend
                password: userData.password,
                phone: userData.phoneNumber,  // Now required
                country: userData.countryName || '',
                state: userData.stateName || ''
            });
            if (response.data.access_token) {
                localStorage.setItem('token', response.data.access_token);
                localStorage.setItem('user', JSON.stringify(response.data));
            }
            return response.data;
        } catch (error) {
            console.error('Signup error:', error);
            if (error.response) {
                throw error.response.data.detail || error.response.data || 'Registration failed';
            } else if (error.request) {
                throw 'No response received from server. Please try again.';
            } else {
                throw error.message || 'Registration failed';
            }
        }
    },

    // Login user
    login: async (credentials) => {
        try {
            const response = await api.post('/user/login', {
                email: credentials.email,
                password: credentials.password
            });
            if (response.data.access_token) {
                localStorage.setItem('token', response.data.access_token);
                localStorage.setItem('user', JSON.stringify(response.data));
            }
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            if (error.response) {
                throw error.response.data.detail || error.response.data || 'Login failed';
            } else if (error.request) {
                throw 'No response received from server. Please try again.';
            } else {
                throw error.message || 'Login failed';
            }
        }
    },

    // Logout user
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // Get current user profile
    getProfile: async (email) => {
        try {
            const response = await api.get(`/user/profile/${email}`);
            return response.data;
        } catch (error) {
            throw error.response?.data?.detail || 'Failed to get profile';
        }
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },
};

// Export the api instance for other services
export default api;
