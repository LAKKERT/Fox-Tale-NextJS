"use client"
import { Header } from "../components/header";
import { SignUpPage } from "../components/signup/signupPage";
import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
export default function SignUp() {
    const [cookies] = useCookies(['auth_token']);
    const router = useRouter();

    useEffect(() => {
        if (cookies.auth_token) {
            router.push("/");
        }
    }, [cookies]);

    return (
        <div className="h-[90vh] w-full mt-[100px] bg-[url('/signup/bg-signup.png')] flex justify-center items-center object-cover bg-cover bg-center bg-no-repeat overflow-hidden">
            <Header />
            <SignUpPage />
        </div>
    );
}