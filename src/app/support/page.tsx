'use client';

import { Header } from "@/app/components/header";
import { Loader } from "@/app/components/load";
import { SupportPageComponent } from "../components/support/suppurtPage";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function SupportPage() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setIsLoading(false);
        }, 300);
    }, []);

    return (
        <div className="w-full h-full bg-[url('/login/gradient_bg.png')] object-cover bg-cover bg-center bg-no-repeat overflow-hidden">
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
                <div className="w-full">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isLoading ? 0 : 1 }}
                        transition={{ duration: .3 }}
                        className="h-full flex items-center"
                    >
                        <Header />
                        <SupportPageComponent />
                    </motion.div>
                </div>
            )}
        </div>
    )
}