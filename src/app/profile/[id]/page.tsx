"use client";
import { Loader } from "@/app/components/load";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCookies } from "react-cookie";

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
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState<userDataState | null>(null);
    const [access, setAccess] = useState(false);
    const [cookies] = useCookies(['auth_token']);

    useEffect(() => {
        if (!cookies.auth_token) {
            router.push("/");
        }
    }, [cookies]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(`/api/users/getUserProfileAPI?userID=${params.id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${cookies.auth_token}`,
                    }
                })

                const userProfile = await response.json();

                setAccess(userProfile?.accessProfile);

                if (userProfile.userRole !== "admin" && userProfile?.accessProfile === false) {
                    router.push('/profile/verify');
                } 

                if (response.ok) {
                    setIsLoading(false);
                    const timeout = setTimeout(() => {
                        setUserData(userProfile?.profile);
                        return () => clearTimeout(timeout);
                    }, 300)
                } else {
                    console.error('Error fetching user profile');
                }

            } catch (error) {
                router.push('/');
                console.error("fetching data error", error);
            }
        };
        fetchUserData();
    }, [params.id, router, cookies]);

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
                        <h1>WELCOME TO YOUR TEMPLE {userData?.username}</h1>
                        <div className="max-w-2xl flex flex-col gap-3">
                            <ChangeLogin userData={userData} />
                            <ChangePassword userData={userData} />
                            <EmailChange userData={userData} />
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
