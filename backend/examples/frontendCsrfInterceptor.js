/**
 * Frontend Axios Interceptor for CSRF Protection
 * Add this to your frontend API configuration
 * 
 * File: frontend/src/services/api.js
 */

import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
    withCredentials: true, // Required for cookies
});

// Store CSRF token
let csrfToken = null;

/**
 * Fetch CSRF token from backend
 */
const fetchCsrfToken = async () => {
    try {
        const response = await api.get('/api/auth/csrf-token');
        csrfToken = response.data.csrfToken;
        return csrfToken;
    } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
        return null;
    }
};

/**
 * Request interceptor - Add CSRF token to headers
 */
api.interceptors.request.use(
    async (config) => {
        // Skip for GET, HEAD, OPTIONS
        if (['GET', 'HEAD', 'OPTIONS'].includes(config.method?.toUpperCase())) {
            return config;
        }

        // Fetch token if not available
        if (!csrfToken) {
            await fetchCsrfToken();
        }

        // Add CSRF token to headers
        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response interceptor - Handle CSRF token errors
 */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If CSRF token is invalid, fetch new one and retry
        if (
            error.response?.status === 403 &&
            error.response?.data?.code === 'CSRF_TOKEN_INVALID' &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            // Fetch new token
            await fetchCsrfToken();

            // Retry original request with new token
            if (csrfToken) {
                originalRequest.headers['X-CSRF-Token'] = csrfToken;
                return api(originalRequest);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
