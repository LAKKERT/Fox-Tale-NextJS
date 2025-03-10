"use client";
import { Loader } from "@/app/components/load";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCookies } from "react-cookie";
import { useUserStore } from "@/stores/userStore";

import { Header } from "@/app/components/header";
import { ChangePassword } from "@/app/components/profiles/passwordChange";
import { EmailChange } from "@/app/components/profiles/emailChange";
import { ChangeLogin } from "@/app/components/profiles/loginChange";
import { motion } from "framer-motion";

import { K2D } from "next/font/google";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

interface userDataState {
    username: string;

}

export default function UserProfile({ params }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [access, setAccess] = useState(false);
    const [cookies] = useCookies(['auth_token']);
    const [currentUserProfile, setCurrentUserProfile] = useState<userDataState | null>(null);
    const userData = useUserStore((state) => state.userData)
    const {
        profileAccess,
    } = useUserStore();

    useEffect(() => {
        if (!cookies.auth_token) {
            router.push("/");
        }

        if (userData) {
            if (profileAccess || !profileAccess && userData.role === 'admin') {
                if (userData.role === 'admin' && userData.id !== params.id) {
                    const fetchUserData = async () => {
                        try {
                            const response = await fetch(`/api/users/getUserProfileAPI?userID=${params.id}`, {
                                method: 'GET',
                                headers: {
                                    'Authorization': `Bearer ${cookies.auth_token}`,
                                }
                            })
    
                            const userProfile = await response.json();
    
                            if (response.ok) {
                                setIsLoading(false);
                                setCurrentUserProfile(userProfile?.profile);
    
                            } else {
                                console.error('Error fetching user profile');
                                router.push('/');
                            }
    
                        } catch (error) {
                            router.push('/');
                            console.error("fetching data error", error);
                        }
                    };
                    fetchUserData();
                } else if (userData.id !== params.id && userData.role !== 'admin') {
                    router.push('/');
                }
            }else if (userData.role !== 'admin') {
                router.push('/profile/verify');
            }
        }
    }, [cookies, router, params, userData]);

    return (
        <div className={`w-full min-h-[calc(100vh-100px)] bg-[url('/login/gradient_bg.png')] object-cover bg-cover bg-center bg-no-repeat ${MainFont.className} caret-transparent`}>
            <Header />
            <div className="h-full mt-[100px] flex flex-col items-center">
                {!userData ? (
                    <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: isLoading ? 1 : 0 }}
                        transition={{ duration: .3 }}
                        className="bg-black w-full h-[100vh]"
                    >
                        <Loader />
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isLoading ? 0 : 1 }}
                        transition={{ duration: .3 }}
                        className="px-3"
                    >
                        <h1>WELCOME TO YOUR TEMPLE {currentUserProfile ? currentUserProfile.username : userData?.username}</h1>
                        <div className="max-w-2xl flex flex-col gap-3">
                            <ChangeLogin userData={currentUserProfile ? currentUserProfile : userData} />
                            <ChangePassword userData={currentUserProfile ? currentUserProfile : userData} />
                            <EmailChange userData={currentUserProfile ? currentUserProfile : userData} />
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
