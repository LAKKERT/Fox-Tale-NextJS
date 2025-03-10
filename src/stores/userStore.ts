import { create } from "zustand";
import { persist } from 'zustand/middleware'


type UserData = {
    id: string;
    username: string;
    role: string;
    email: string;
} | null;

type UserState = {
    profileAccess: boolean;
    isAuth: boolean;
    userData: UserData;
    setProfileAccess: (access: boolean) => void;
    setIsAuth: (auth: boolean) => void;
    setUserData: (data: UserData) => void;
};

export const useUserStore = create(
    persist<UserState>(
        (set) => ({
            profileAccess: false,
            isAuth: false,
            userData: null,
            setProfileAccess: (access) => set({ profileAccess: access }),
            setIsAuth: (auth) => set({ isAuth: auth }),
            setUserData: (data) => set({ userData: data }),
        }),
        { name: 'userdata-storage' },
    )
);