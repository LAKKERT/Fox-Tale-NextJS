"use client";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { clearTimeout } from "timers";
import { motion } from "framer-motion";

const validationSchema = Yup.object().shape({
    login: Yup.string().min(4, "Login must be at least 4 characters").required("Enter your new login")
})

export function ChangeLogin({ userData }) {
    const [clientError, setClientError] = useState({});
    const [serverError, setServerError] = useState({});
    const [serverMessage, setServerMessage] = useState("")

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
    });

    useEffect(() => {
        if (errors) {
            setClientError(errors);
        } else {
            const timeout = setTimeout(() => {
                setClientError(errors);
                return () => clearTimeout(timeout)
            })
        }
    }, [errors]);

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                id: userData.id,
            }

            const response = await fetch('/api/profile/changeLogin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            const result = await response.json();

            if (response.ok) {
                setServerMessage(result.message)
                reset()
            } else {
                console.error('Error:', result.message);
                setServerError(result.errors)
                setServerMessage(result.message)
                reset()
            }
        } catch (errors) {
            console.error('Error:', errors);
            setServerMessage('An unexpected error occurred.')
            reset()
        }
    }

    return (
        <div className="w-full flex flex-col lg:flex-row justify-center items-center py-3 lg:py-6  px-4 lg:px-6 gap-3 bg-[#272727] text-center text-white text-lg lg:text-lg text-balance rounded-md lg:rounded-xl">
            <div>
                <p>If you want to change your username, fill out the form</p>
            </div>

            <div className="w-full flex flex-col gap-3">
                <p>Change username</p>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 text-balance">
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: clientError.login?.message || serverError?.login || serverMessage ? 1 : 0, height: clientError.login?.message || serverError?.login || serverMessage ? 30 : 0 }}
                        transition={{ duration: .3 }}
                        className="text-orange-300 text-sm sm:text-large"
                    >
                        {clientError.login?.message || serverError?.login || serverMessage}
                    </motion.p>
                    <input type="text" {...register("login")} placeholder="Your new username" className="w-full h-11 bg-[rgba(73,73,73,.56)] rounded text-white text-center outline-[#C67E5F] focus:outline" />
                    <input type="submit" value="Save changes" className="w-full h-11 bg-[#C67E5F] hover:bg-[rgba(198,126,95,.80)] rounded text-white text-center cursor-pointer transition-all duration-150 ease-in-out" />
                </form>
            </div>

        </div>
    );
}