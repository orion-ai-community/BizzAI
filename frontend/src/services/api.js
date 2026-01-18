import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
});

// Response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => {
        // If response is successful, just return it
        return response;
    },
    (error) => {
        // Check if error is due to authentication (401 Unauthorized)
        if (error.response && error.response.status === 401) {
            // Clear all user data from localStorage
            localStorage.removeItem('user');
            localStorage.removeItem('returnDraft');

            // Show professional notification
            toast.error('Your session has expired. Please log in again to continue.', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });

            // Redirect to login page after a brief delay
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        }

        // Return the error for other cases
        return Promise.reject(error);
    }
);

export default api;
