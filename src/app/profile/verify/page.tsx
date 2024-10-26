"use client";
import { useState, useEffect } from "react";
import { getUserProfile } from "@/pages/api/users/usersAPI";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { useForm } from "react-hook-form";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { Header } from "@/app/components/header";
import { ChangePassword } from "@/app/components/profiles/passwordChange";
import { EmailChange } from "@/app/components/profiles/emailChange";

import { createVerificationCode } from "@/pages/api/profile/verifyUserAPI";

const validationSchema = Yup.object().shape({
    code: Yup.number().min(1000, 'Number must be a 4-digit number').max(9999, 'Number must be a 4-digit number').typeError('Please enter a 4-digit number'),
})

export default function VerifyPage() {
    const [userData, setUserData] = useState(null);
    const [serverMessage, setServerMessage] = useState("");
    const [serverError, setServerError] = useState({});
    const [clientError, setClientError] = useState({});
    const [cookies] = useCookies(['auth_token']);
    const router = useRouter();

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema)
    })

    useEffect(() => {
        if (errors) {
            setClientError(errors);
        } else {
            const timeout = setTimeout(() => {
                setClientError(errors);
                return () => clearTimeout(timeout);
            }, 300);
        }
    }, [errors]);

    const onSubmit = async (data) => {
        try {
            const payLoad = await {
                ...data,
                cookies
            }

            const response = await fetch('/api/profile/verifyUserAPI', {
                method: 'POST',
                headers: {
                    'content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),
            });

            const result = await response.json();

            if (response.ok) {
                router.push(result.redirectUrl);
            } else {
                setServerError(result.errors);
                setServerMessage(result.message);
                console.error("Failed to verify user");
            }

        } catch (error) {
            setServerMessage("An unexpected error occurred.");
        }
    }

    useEffect(() => {
        const verifyUser = async () => {
            const verifyData = await createVerificationCode(cookies);

            if (verifyData?.redirectUrl) {
                router.push(verifyData.redirectUrl);
            } else {
                console.error('Error during verification:', verifyData?.error);
            }
        };

        verifyUser();
    }, [cookies, router]);

    return (
        <div className="h-[100vh] w-full bg-[url('/signup/bg-signup.png')] flex justify-center items-center object-cover bg-cover bg-center bg-no-repeat overflow-hidden">
            <div className="bg-[rgba(6,6,6,.65)] flex flex-col gap-4 py-9 px-5 rounded-lg text-center">
                <p>the code was sent to the email: {userData?.email}</p>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col justify-center items-center text-center gap-6">
                    <div className="flex flex-col text-center">
                        <motion.p
                            initial={{ opacity: 0, height: 0}}
                            animate={{ opacity: errors.code?.message || serverError?.code || serverMessage ? 1 : 0, height: errors.code?.message || serverError?.code || serverMessage ? 30 : 0 }}
                            transition={{ duration: .3 }}
                            className="text-orange-300"
                        >
                            { errors.code?.message || serverError?.code || serverMessage }
                        </motion.p>
                        <input type="text" maxLength={4} autoComplete="off" {...register("code")} className="w-[250px] sm:w-[350px] md:w-[500px] border-b-2 bg-transparent tracking-[25px] text-center text-2xl outline-none" placeholder="CODE" />
                    </div>
                    <input type="submit" value="VERIFY" className="w-[250px] h-[50px] text-2xl tracking-widest rounded border border-[#F5DEB3] bg-[#C2724F] cursor-pointer transition duration-75 ease-in-out hover:bg-[rgba(194,114,79,.7)]" />
                </form>
            </div>
        </div>
    );
}