"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile } from "@/pages/api/users/usersAPI";
import { useCookies } from "react-cookie";

import { useForm } from "react-hook-form";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { Header } from "@/app/components/header";
import { ChangePassword } from "@/app/components/profiles/passwordChange";
import { EmailChange } from "@/app/components/profiles/emailChange";
import { ChangeLogin } from "@/app/components/profiles/loginChange";

import { K2D } from "next/font/google";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

const validationSchema = Yup.object().shape({
    code: Yup.number().min(1000, 'Number must be a 4-digit number').max(9999, 'Number must be a 4-digit number').typeError('Please enter a 4-digit number'),
})

export default function UserProfile({ params }) {
    const router = useRouter();
    const [userData, setUserData] = useState(null);
    const [access, setAccess] = useState(false);
    const [cookies] = useCookies(['auth_token']);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema)
    })

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const data = await getUserProfile(params.id, cookies);
                setUserData(data?.profile);
                setAccess(data?.accessProfile);
                if (data.UserRole !== "admin") {
                    if (data?.accessProfile === false) {
                        router.push('/profile/verify')
                    }
                }
            } catch (error) {
                console.error("fetching data error", error);
            }
        };
        fetchUserData();
    }, [params.id]);

    return (
        <div className={`w-full h-full bg-[url('/login/gradient_bg.png')] object-cover bg-cover bg-center bg-no-repeat ${MainFont.className}`}>
            <Header />
            <div className="h-full mt-[100px] flex flex-col items-center px-2 py-8">
                {userData ? (
                    <div>
                        <h1>WELCOME TO YOUR TEMPLE {userData.username}</h1>
                        <div className="max-w-2xl flex flex-col gap-3">
                            <ChangeLogin userData={userData} />
                            <ChangePassword userData={userData} />
                            <EmailChange userData={userData} />
                        </div>
                    </div>
                ) : (
                    <div>Loading...</div>
                )}
            </div>
        </div>
    );
}
