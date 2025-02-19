"use client";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { motion } from "framer-motion";
import { redirect, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

const validationSchema = Yup.object().shape({
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Enter your password'),
    repeatPassword: Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match').required('Repeat your password'),
})

export function PasswordResetComponent() {
    const [clientError, setClientError] = useState({});
    const [serverError, setServerError] = useState({});
    const [serverMessage, setServerMessage] = useState("");

    const router = useRouter();

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema)
    });

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
                        animate={{ opacity: clientError.password?.message || serverError?.password ? 1 : 0, height: clientError.password?.message || serverError?.password ? 30 : 0 }}
                        transition={{ duration: .3 }}
                        className="text-orange-300 text-[13px] sm:text-[18px]"
                    >
                        {clientError.password?.message || serverError?.password}
                    </motion.p>
                    <input type="password" {...register("password")} placeholder="New password" className="w-full h-11 bg-[rgba(73,73,73,.56)] rounded text-white text-center outline-[#C67E5F] focus:outline caret-white" />
                </div>

                <div className="h-auto flex flex-col text-center">
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: clientError.repeatPassword?.message || serverError?.repeatPassword ? 1 : 0, height: clientError.repeatPassword?.message || serverError?.repeatPassword ? 30 : 0 }}
                        transition={{ duration: .3 }}
                        className="text-orange-300 text-[13px] sm:text-[18px]"
                    >
                        {clientError.repeatPassword?.message || serverError?.repeatPassword}
                    </motion.p>
                    <input type="password" {...register("repeatPassword")} placeholder="Repeat new password" className="w-full h-11 bg-[rgba(73,73,73,.56)] rounded text-white text-center outline-[#C67E5F] focus:outline caret-white" />
                </div>

                <input type="submit" value="Save changes" className="w-full h-11 bg-[#C67E5F] hover:bg-[rgba(198,126,95,.80)] rounded text-white text-center cursor-pointer transition-all duration-150 ease-in-out" />
            </form>
        </div>
    );
}