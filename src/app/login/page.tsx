"use client";
import { useEffect } from "react";
import { Header } from "../components/header";
import { LoginPage } from "../components/login/loginPage";

export default function Login() {
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);
    return (
        <div className="w-full h-full bg-[url('/login/gradient_bg.png')] object-cover bg-cover bg-center bg-no-repeat overflow-hidden">
                <Header />
                <LoginPage />
        </div>
    );
}