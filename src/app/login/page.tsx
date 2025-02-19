"use client";
import { useEffect, useState } from "react";
import { Loader } from "@/app/components/load";
import { Header } from "../components/header";
import { LoginPage } from "../components/login/loginPage";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Login() {
    const [isLoading, setIsLoading] = useState(true);
    const [showContent, setShowContent] = useState(false);
    const [cookies] = useCookies();
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
            router.push('/');
        }
    }, [cookies]);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    return (
        <div className="w-full min-h-[calc(100vh-100px)] mt-[100px] bg-[url('/login/gradient_bg.png')] object-cover bg-cover bg-center bg-no-repeat overflow-hidden caret-transparent">
            {isLoading ? (
                <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-black fixed inset-0 flex justify-center items-center"
                >
                    <Loader />
                </motion.div>
            ) : null}

            {showContent ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}

                >
                    <Header />
                    <div className="flex flex-col justify-center items-center">
                        <LoginPage />
                    </div>
                </motion.div>
            ) : null}
        </div>
    );
}