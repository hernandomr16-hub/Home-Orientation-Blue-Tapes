import api from './api';
import type { Token, User, UserCreate } from '../types';

export const authService = {
    async login(email: string, password: string): Promise<Token> {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const response = await api.post<Token>('/api/auth/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        // Store token and user
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        return response.data;
    },

    async register(data: UserCreate): Promise<User> {
        const response = await api.post<User>('/api/auth/register', data);
        return response.data;
    },

    async getMe(): Promise<User> {
        const response = await api.get<User>('/api/auth/me');
        return response.data;
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getToken(): string | null {
        return localStorage.getItem('token');
    },

    getUser(): User | null {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    },

    async updateProfile(data: { name?: string; phone?: string }): Promise<User> {
        const response = await api.put<User>('/api/auth/me', data);
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
    },

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await api.put('/api/auth/me/password', {
            current_password: currentPassword,
            new_password: newPassword,
        });
    },
};
