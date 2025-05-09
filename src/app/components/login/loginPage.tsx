"use client";
import { Loader } from "@/app/components/load";
import { useForm } from "react-hook-form";
import { useState } from "react";
import * as Yup from "yup";
import Link from "next/link";
import { K2D } from "next/font/google";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion"
import { yupResolver } from "@hookform/resolvers/yup";
import { useUserStore } from "@/stores/userStore";
import { supabase } from "@/lib/supabase/supabaseClient";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

interface userInterface {
    username: string;
    password: string;
}

const validationSchema = Yup.object().shape({
    username: Yup.string().min(4, 'Username must be at least 4 characters').required('Enter your username'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Enter your password'),
});

export function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [serverMessage, setServerMessage] = useState('');
    const [serverError, setServerError] = useState<userInterface>({
        username: '',
        password: ''
    });
    const {
        setProfileAccess,
        setUserData,
        setIsAuth
    } = useUserStore()

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema)
    });

    setTimeout(() => {
        setIsLoading(false);
    }, 300)

    const onSubmit = async (formData: userInterface) => {
        try {
            if (process.env.NEXT_PUBLIC_ENV === 'production') {
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: formData.username,
                    password: formData.password,
                });

                if (signInError) {
                    console.error('Supabase sign-in error occurred', signInError);
                } else if (signInData && signInData.user) {
                    const userId = signInData.user.id;
                    const { data: userMetadata, error: metadataError } = await supabase
                        .from('user_metadata')
                        .select('*')
                        .eq('userID', userId)
                        .single()

                    if (metadataError) {
                        console.error('Error fetching user metadata:', metadataError);
                    } else if (userMetadata) {
                        setUserData({
                            id: userId || '',
                            username: userMetadata.username || '',
                            email: signInData.user.email || '',
                            role: userMetadata.role || 'authenticated',
                        });
                        setIsAuth(true);
                        router.push('/');
                    }
                }
            } else {
                const response = await fetch('/api/users/loginAPI', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                })

                const result = await response.json();

                if (response.ok) {
                    setProfileAccess(false)
                    router.push(result.redirectUrl);
                } else {
                    setServerMessage(result.message);
                    setServerError(result.errors);
                }
            }
        } catch (error) {
            console.error('Error logging in:', error);
        }
    }
    return (
        <div>
            {isLoading ? (
                <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: .3 }}
                    className="bg-black w-full h-[100vh]"
                >
                    <Loader />
                </motion.div>
            ) : (
                <div className={`h-[90vh] w-full flex flex-col justify-center items-center gap-2 ${MainFont.className} text-center text-white caret-transparent`}>
                    <h1 className="uppercase  text-4xl drop-shadow-[4px_4px_2px_rgba(0,0,0,0.5)]">LOG IN</h1>
                    <div className="w-[290px] h-[380px] sm:w-[500px] md:w-[730px] md:h-[429px] flex flex-col justify-center items-center gap-3 md:gap-12 px-6 md:px-[100px]  bg-[rgba(6,6,6,.65)] rounded-lg">
                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col items-center gap-8 md:gap-12">
                            <div className="flex flex-col text-center">
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: errors.username?.message || serverError?.username || serverMessage ? 1 : 0, height: errors.username?.message || serverError?.username || serverMessage ? 30 : 0 }}
                                    transition={{ duration: .3 }}
                                    className="text-orange-300 text-[13px] sm:text-[18px]"
                                >
                                    {errors.username?.message || serverError?.username || serverMessage}
                                </motion.p>
                                <input type="text" {...register("username")} className="w-[250px] sm:w-[350px] md:w-[500px] border-b-2 tracking-wider bg-transparent text-center text-2xl outline-none focus:caret-white" placeholder="Login" />
                            </div>

                            <div className="flex flex-col text-center">
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: errors.password?.message || serverError?.password ? 1 : 0, height: errors.password?.message || serverError?.password ? 30 : 0 }}
                                    transition={{ duration: .3 }}
                                    className="text-orange-300 text-[13px] sm:text-[18px]"
                                >
                                    {errors.password?.message || serverError?.password}
                                </motion.p>
                                <input type="password" {...register("password")} className="w-[250px] sm:w-[350px] md:w-[500px] border-b-2 tracking-wider bg-transparent text-center text-2xl outline-none focus:caret-white" placeholder="Password" />
                            </div>
                            <input type="submit" value="LOGIN" className="w-[250px] h-[50px] text-lg tracking-wider transition-colors duration-75 rounded border border-[#F5DEB3] bg-[#C2724F] hover:bg-[#c2724f91]" />
                        </form>
                        <div className="flex flex-col text-center gap-2 uppercase text-base underline tracking-widest">
                            <Link href="/restoring_access">CAN’N LOG IN</Link>
                            <Link href="/signup">CREATE ACCOUNT</Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}