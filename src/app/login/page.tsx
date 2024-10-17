"use client";
import { useEffect } from "react";
import { Header } from "../components/header";
import { LoginPage } from "../components/login/loginPage";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";

export default function Login() {
    const [cookies] = useCookies();
    const router = useRouter();

    useEffect(() => {
        if (cookies.auth_token) {
            router.push('/');
        }
    },[cookies]);

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