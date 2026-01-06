import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only handle 401 for non-auth endpoints
        // This prevents logout during login flow race conditions
        const isAuthEndpoint = error.config?.url?.includes('/auth/');

        if (error.response?.status === 401 && !isAuthEndpoint) {
            // Verify token is actually missing or invalid, not just a race condition
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
