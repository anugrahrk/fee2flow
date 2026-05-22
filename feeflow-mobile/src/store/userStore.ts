import { create } from 'zustand';
import { useAuth } from '@clerk/clerk-expo';
import axios from 'axios';

interface UserState {
    user: any | null;
    role: string | null;
    isLoading: boolean;
    error: string | null;
    fetchProfile: (getToken: () => Promise<string | null>) => Promise<string | null>;
    logout: () => void;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const useUserStore = create<UserState>((set) => ({
    user: null,
    role: null,
    isLoading: false,
    error: null,

    fetchProfile: async (getToken) => {
        set({ isLoading: true, error: null });
        try {
            const token = await getToken();
            if (!token) throw new Error("No token available");

            const response = await axios.get(`${API_URL}/api/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const { role, user } = response.data;

            set({ user, role, isLoading: false });
            return role;
        } catch (error: any) {
            console.error("Failed to fetch profile:", error);
            set({
                error: error.response?.data?.message || 'Failed to fetch profile',
                isLoading: false,
                role: null,
                user: null
            });
            return null;
        }
    },

    logout: () => {
        set({ user: null, role: null, error: null });
    }
}));
