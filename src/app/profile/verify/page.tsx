"use client";
import { useState, useEffect } from "react";
import { getUserProfile } from "@/pages/api/users/usersAPI";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";

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
    const [cookies] = useCookies(['auth_token']);
    const router = useRouter();

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema)
    })

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
                console.log("User verified successfully!");
                router.push(result.redirectUrl);
            } else {
                console.error("Failed to verify user");
            }

        } catch (error) {
            console.log("Error updating password", error);
        }
    }

    useEffect(() => {
        console.log(cookies)
        createVerificationCode(cookies)
    }, [cookies]);

    return (
        <div>
            <div>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <input type="text" {...register("code")} placeholder="code" />
                    <button type="submit">Verify</button>
                </form>
            </div>
        </div>
    );
}