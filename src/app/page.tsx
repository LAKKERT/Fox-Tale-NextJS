"use client";
import Image from "next/image";
import { Header } from "@/app/components/header";
import { Main } from "./components/home/homePage";
import { Footer } from "./components/footer";
import { Loader } from "@/app/components/load";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Home() {
    const [isLoading, setIsLoading] = useState(true);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setIsLoading(false);
            setTimeout(() => setShowContent(true), 300);
        }, 300); 

        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="bg-black">
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
                    <Main />
                    <Footer />
                </motion.div>
            ) : null}
        </div>
    );
}
