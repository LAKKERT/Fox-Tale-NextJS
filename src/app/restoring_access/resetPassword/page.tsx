"use client";
import { PasswordResetComponent } from "@/app/components/requests_components/reset_password"; 
import { useEffect } from "react";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import { K2D } from "next/font/google";


const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});


export default function ResetPassword() {
    const [cookies] = useCookies();
    const router = useRouter();

    useEffect(() => {
        if (cookies.auth_token) {
            router.push('/');
        }
    },[cookies, router]);

    return (
        <div className={`h-[100vh] w-full bg-[url('/signup/bg-signup.png')] flex justify-center items-center object-cover bg-cover bg-center bg-no-repeat overflow-hidden text-white ${MainFont.className} caret-transparent`}>
            <div className="w-[290px] h-[320px] sm:w-[500px] sm:h-[300px] md:w-[730px] md:h-[330px] flex flex-col items-center justify-center px-6 py-5 md:px-[100px] bg-[rgba(6,6,6,.65)] rounded-lg select-none">
                <p>Enter your new password</p>
                <PasswordResetComponent />
            </div>
        </div>
    );
}