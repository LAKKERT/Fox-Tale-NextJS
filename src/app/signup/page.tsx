"use client"
import { Header } from "../components/header";
import { Loader } from "@/app/components/load";
import { SignUpPage } from "../components/signup/signupPage";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SignUp() {
    const [isLoading, setIsLoading] = useState(true);
    const [showContent, setShowContent] = useState(false);
    const [cookies] = useCookies(['auth_token']);
    const router = useRouter();

    useEffect(() => {
        const timeout = setTimeout(() => {
            setIsLoading(false);
            setTimeout(() => setShowContent(true), 300);
        }, 300);

        return () => clearTimeout(timeout);
    });

    useEffect(() => {
        if (cookies.auth_token) {
            router.push("/");
        }
    }, [cookies]);

    return (
        <div className=" caret-transparent">
            <Header />
            {isLoading ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="h-full w-full bg-[rgba(0,0,0,.65)] rounded-lg flex flex-col items-center justify-center text-white"
                    >
                    <Loader />
                </motion.div>
            ) : null}

            {showContent ? (
                <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="min-h-[calc(100vh-100px)] w-full flex flex-col justify-center items-center mt-[100px] bg-[url('/signup/bg-signup.png')] object-cover bg-cover bg-center bg-no-repeat overflow-hidden"
                >
                    <div>
                        <SignUpPage />
                    </div>
                </motion.div>
            ) : null}
        </div>
    );
}