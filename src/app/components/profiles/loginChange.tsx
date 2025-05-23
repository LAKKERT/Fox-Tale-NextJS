"use client";
import { useForm } from "react-hook-form";
import { useState } from "react";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/supabaseClient";
import { useUserStore } from "@/stores/userStore";

interface userData {
    login: string;
}

const validationSchema = Yup.object().shape({
    login: Yup.string().min(4, "Login must be at least 4 characters").required("Enter your new login")
})

export function ChangeLogin({ userData }: { userData: { id: string, email: string } }) {
    const {
        setUserData
    } = useUserStore()
    const [serverError, setServerError] = useState<{ login: string }>({
        login: "",
    });
    const [serverMessage, setServerMessage] = useState("")

    const { register, handleSubmit, reset, formState: { errors } } = useForm<userData>({
        resolver: yupResolver(validationSchema),
    });

    const onSubmit = async (data: userData) => {
        try {
            if (process.env.NEXT_PUBLIC_ENV === 'production') {
                const { error } = await supabase.auth.updateUser({
                    data: { username: `${data.login}` }
                })

                if (error) {
                    setServerError({ login: 'Username change: error occured' });
                    console.error(error);
                } else {
                    setUserData({
                        id: userData.id || '',
                        username: data.login,
                        email: userData.email,
                    });
                    setServerMessage('Username was updated');
                }

            } else {
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
            }
        } catch (errors) {
            console.error('Error:', errors);
            setServerMessage('An unexpected error occurred.')
            reset()
        }
    }

    return (
        <div className="w-full flex flex-col lg:flex-row justify-center items-center py-3 lg:py-6  px-4 lg:px-6 gap-3 bg-[#272727] text-center text-white text-lg lg:text-lg text-balance rounded-md lg:rounded-xl caret-transparent">
            <div>
                <p>If you want to change your username, fill out the form</p>
            </div>

            <div className="w-full flex flex-col gap-3">
                <p>Change username</p>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 text-balance">
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: errors.login?.message || serverError?.login || serverMessage ? 1 : 0, height: errors.login?.message || serverError?.login || serverMessage ? 30 : 0 }}
                        transition={{ duration: .3 }}
                        className="text-orange-300 text-[13px] sm:text-[18px]"
                    >
                        {errors.login?.message || serverError?.login || serverMessage}
                    </motion.p>
                    <input type="text" {...register("login")} placeholder="Your new username" className="w-full h-11 bg-[rgba(73,73,73,.56)] rounded text-white text-center outline-[#C67E5F] focus:outline focus:caret-white" />
                    <input type="submit" value="Save changes" className="w-full h-11 bg-[#C67E5F] hover:bg-[rgba(198,126,95,.80)] rounded text-white text-center cursor-pointer transition-all duration-150 ease-in-out" />
                </form>
            </div>

        </div>
    );
}