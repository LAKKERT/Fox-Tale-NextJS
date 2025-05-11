"use client";
import { Loader } from "@/app/components/load";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCookies } from "react-cookie";
import { useUserStore } from "@/stores/userStore";
import { useParams } from "next/navigation";

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
    id: string;
    email: string;
    username: string;
}

export default function UserProfile() {
    const params = useParams()
    const router = useRouter();
    const userData = useUserStore((state) => state.userData)
    const [isLoading, setIsLoading] = useState(true);
    const [cookies] = useCookies(['auth_token']);
    const [currentUserProfile, setCurrentUserProfile] = useState<userDataState | null>(null);

    const {
        profileAccess,
    } = useUserStore();

    useEffect(() => {
        let isMounted = true;

        const loadProfile = async () => {
            try {
                if (!userData) {
                    // router.push('/');
                    return;
                };

                if (!profileAccess && userData.role !== 'admin') {
                    router.push('/profile/verify');
                    return;
                }

                if (userData.id === params?.id) {
                    if (isMounted) {
                        setCurrentUserProfile(userData);
                        setIsLoading(false);
                    }
                    return;
                }

                if (userData.role === 'admin' && userData.id !== params?.id) {
                    const response = await fetch(`/api/users/getUserProfileAPI?userID=${params?.id}`, {
                        headers: { 'Authorization': `Bearer ${cookies.auth_token}` }
                    });

                    if (!response.ok) throw new Error('Profile not found');

                    const { profile } = await response.json();
                    if (isMounted) {
                        setCurrentUserProfile(profile);
                        setIsLoading(false);
                    }
                    return;
                }

                router.push('/');

            } catch (error) {
                console.error(error);
                if (isMounted) router.push('/');
            }
        };

        setTimeout(() => {
            loadProfile();
        }, 1000)

        return () => {
            isMounted = false;
        };
    }, [cookies, router, params, userData, profileAccess]);

    return (
        <div className={`w-full min-h-[calc(100vh-100px)] bg-[url('/login/gradient_bg.png')] object-cover bg-cover bg-center bg-no-repeat ${MainFont.className} caret-transparent`}>
            <Header />
            <div className="h-full mt-[100px] flex flex-col items-center">
                {isLoading ? (
                    <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: .3 }}
                        className="bg-black w-full h-[100vh]"
                    >
                        <Loader />
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: .3 }}
                        className="px-3"
                    >
                        {/* <h1 className="h-[100vh] w-[100vh] bg-black text-2xl font-bold text-white">Profile</h1> */}
                        <h1>WELCOME TO YOUR TEMPLE {currentUserProfile ? currentUserProfile.username : userData?.username}</h1>
                        <div className="max-w-2xl flex flex-col gap-3">
                            <ChangeLogin userData={currentUserProfile || userData!} />
                            <ChangePassword userData={currentUserProfile || userData!} />
                            <EmailChange userData={currentUserProfile || userData!} />
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
