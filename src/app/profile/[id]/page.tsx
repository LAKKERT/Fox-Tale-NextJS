"use client";
import { useState, useEffect } from "react";
import { getUserProfile } from "@/pages/api/users/usersAPI";
import { useCookies } from "react-cookie";

import { Header } from "@/app/components/header";
import { ChangePassword } from "@/app/components/profiles/passwordChange";
import { EmailChange } from "@/app/components/profiles/emailChange";

import { K2D } from "next/font/google";
const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

export default function UserProfile({ params }) {
    const [userData, setUserData] = useState(null);
    const [cookies] = useCookies(['auth_token']);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const data = await getUserProfile(params.id, cookies);
                setUserData(data);
            } catch (error) {
                console.log("fetching data error", error);
            }
        };
        fetchUserData();
    }, [params.id]);

    return (
        <div className={`w-full h-[90vh] mt-[100px] px-2 flex flex-col justify-center items-center bg-[url('/login/gradient_bg.png')] object-cover bg-cover bg-center bg-no-repeat overflow-hidden ${MainFont.className}`}>
            <Header />
            {userData ? (
                <>
                    <h1>WELCOME TO YOUR TEMPLE {userData.username}</h1>
                    <div className="max-w-2xl flex flex-col gap-3">
                        <ChangePassword userData={userData} />
                        <EmailChange userData={userData} />
                    </div>
                </>
            ) : (
                <div>Loading...</div>
            )}
        </div>
    );    
}
