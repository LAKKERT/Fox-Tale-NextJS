"use client";
import { useForm } from "react-hook-form";
import { useState } from "react";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface userData {
    password: string;
    repeatPassword: string;
}

const validationSchema = Yup.object().shape({
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Enter your password'),
    repeatPassword: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Repeat your password'),
})

export function PasswordResetComponent() {
    const [serverError, setServerError] = useState<{password: string, repeatPassword: string}>({
        password: "",
        repeatPassword: "",
    });
    const [serverMessage, setServerMessage] = useState("");

    const router = useRouter();

    const token = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('token') 
    : null;
    console.log('token', token)

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema)
    });

    const onSubmit = async (data: userData) => {
        try {
            const payload = {
                ...data,
                token: token
            }

            const response = await fetch('/api/users/userDataReset/resetPasswordAPI', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            const result = await response.json();

            if (response.ok) {
                router.push(result.redirectUrl)

            } else {
                setServerError(result.errors);
                setServerMessage(result.message);
                console.error("Failed to reset password")
            }

        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-balance caret-transparent">
                <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: serverMessage ? 1 : 0, height: serverMessage ? 30 : 0 }}
                    transition={{ duration: .3 }}
                    className="text-center text-orange-300 text-[13px] sm:text-[18px]"
                >
                    {serverMessage}
                </motion.p>
                <div className="flex flex-col text-center">
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: errors.password?.message || serverError?.password ? 1 : 0, height: errors.password?.message || serverError?.password ? 30 : 0 }}
                        transition={{ duration: .3 }}
                        className="text-orange-300 text-[13px] sm:text-[18px]"
                    >
                        {errors.password?.message || serverError?.password}
                    </motion.p>
                    <input type="password" {...register("password")} placeholder="New password" className="w-full h-11 bg-[rgba(73,73,73,.56)] rounded text-white text-center outline-[#C67E5F] focus:outline caret-white" />
                </div>

                <div className="h-auto flex flex-col text-center">
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: errors.repeatPassword?.message || serverError?.repeatPassword ? 1 : 0, height: errors.repeatPassword?.message || serverError?.repeatPassword ? 30 : 0 }}
                        transition={{ duration: .3 }}
                        className="text-orange-300 text-[13px] sm:text-[18px]"
                    >
                        {errors.repeatPassword?.message || serverError?.repeatPassword}
                    </motion.p>
                    <input type="password" {...register("repeatPassword")} placeholder="Repeat new password" className="w-full h-11 bg-[rgba(73,73,73,.56)] rounded text-white text-center outline-[#C67E5F] focus:outline caret-white" />
                </div>

                <input type="submit" value="Save changes" className="w-full h-11 bg-[#C67E5F] hover:bg-[rgba(198,126,95,.80)] rounded text-white text-center cursor-pointer transition-all duration-150 ease-in-out" />
            </form>
        </div>
    );
}