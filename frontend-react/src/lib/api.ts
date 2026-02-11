import axios from 'axios';

const api = axios.create({
    // Use /api to leverage Next.js rewrites (configured in next.config.ts)
    // This ensures the frontend always connects to the correct backend
    baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized error (e.g., redirect to login)
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Avoid infinite redirect loop
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export const confirmReport = async (reportId: string, selectedAccessories: any[] = [], paymentMethod: string | null = null) => {
    try {
        const response = await api.put(`/reports/${reportId}/confirm`, { selectedAccessories, paymentMethod });
        return response.data;
    } catch (error) {
        console.error('Error confirming report:', error);
        throw error;
    }
};

export default api;
