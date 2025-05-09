"use client";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/supabaseClient";

import Link from "next/link";
import { K2D } from "next/font/google";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

interface userInterface {
    email: string;
    username: string;
    password: string;
    password2: string;
}


const validationSchema = Yup.object().shape({
    email: Yup.string().email('EMAIL is not correct').required('Enter your EMAIL'),
    username: Yup.string().min(4, 'Username must be at least 4 characters').required('Enter your username'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Enter your password'),
    password2: Yup.string().oneOf([Yup.ref('password'), undefined], 'Passwords must match').required('Confirm your password'),
});

export function SignUpPage() {
    const router = useRouter();
    const [serverMessage, setServerMessage] = useState("");
    const [serverError, setServerError] = useState<userInterface>({
        email: "",
        username: "",
        password: "",
        password2: "",
    });

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
    });

    const onSubmit = async (formData: userInterface) => {
        try {
            if (process.env.NEXT_PUBLIC_ENV === 'production') {
                const { data, error } = await supabase.auth.signUp(
                {
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            username: formData.username,
                        }
                    }
                });
                if (error) console.error('error occured', error);
                if (data) {
                    console.log('succsess', data)
                    const { error } = await supabase
                        .from('user_metadata')
                        .upsert({ userID: data.user?.id, username: data.user?.user_metadata.username, role: 'user' })
                        .select()
                }
                if (error) console.error('error occured', error);
                
            }else {
                const response = await fetch('/api/users/signupAPI', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });
    
                const result = await response.json();
    
                if (response.ok) {
                    router.push(result.redirectUrl);
                } else {
                    console.error("Failed to create user");
                    setServerError(result.errors);
                    setServerMessage(result.message);
                }
            }
        } catch (error) {
            console.error("Error:", error);
            setServerMessage("An unexpected error occurred.");
        }
    };

    return (
        <div>
            <div className={`w-full h-full flex flex-col justify-center items-center gap-2 ${MainFont.className} text-white`}>
                <h1 className="uppercase text-center text-3xl sm:text-4xl text-balance drop-shadow-[4px_4px_2px_rgba(0,0,0,0.5)]">YOUR ADVENTURE STARTS HERE</h1>
                <div className="w-[290px] h-auto sm:w-[500px] md:w-[730px] flex flex-col justify-center items-center gap-3 md:gap-8 px-4 md:px-[100px] py-[20px] bg-[rgba(6,6,6,.65)] rounded-lg">
                    <div className="sm:text-2xl text-center">FIRST, LET’S GET YOUR INFO</div>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col items-center gap-8 md:gap-12">
                        <div className="flex flex-col text-center">
                            <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: errors.email?.message || serverError?.email || (serverMessage && serverMessage.includes("Email")) ? 1 : 0, height: errors.email?.message || serverError?.email || (serverMessage && serverMessage.includes("Email")) ? 30 : 0}}
                                transition={{ duration: .3 }}
                                className="text-orange-300 text-[13px] sm:text-[18px]"
                            >
                                {errors.email?.message || serverError?.email || (serverMessage && serverMessage.includes("Email") ? serverMessage : '')}
                            </motion.p>
                            <input type="email" autoComplete="off" {...register("email")} className="w-[250px] sm:w-[350px] md:w-[500px] border-b-2 tracking-wider bg-transparent text-center text-2xl outline-none focus:caret-white" placeholder="Enter email here" />
                        </div>
                        <div className="flex flex-col text-center">
                            <motion.p
                                initial={{ opacity: 0, height: 0}}
                                animate={{ opacity: errors.username?.message || serverError?.username || (serverMessage && serverMessage.includes("Username")) ? 1 : 0, height: errors.username?.message || serverError?.username || (serverMessage && serverMessage.includes("Username")) ? 30 : 0 }}
                                transition={{ duration: .3 }}
                                className="text-orange-300 text-[13px] sm:text-[18px]"
                                >
                                {errors.username?.message || serverError?.username || (serverMessage && serverMessage.includes("Username") ? serverMessage : '')}
                            </motion.p>
                            <input type="text" autoComplete="off" {...register("username")} className="w-[250px] sm:w-[350px] md:w-[500px] border-b-2 tracking-wider bg-transparent text-center text-2xl outline-none focus:caret-white" placeholder="Login" />
                        </div>
                        <div className="flex flex-col text-center">
                            <motion.p
                                initial={{ opacity: 0, height: 0}}
                                animate={{ opacity: errors.password?.message || (serverError?.password && serverError.password) ? 1 : 0, height: errors.password?.message || (serverError?.password && serverError.password) ? 30 : 0 }}
                                transition={{ duration: .3 }}
                                className="text-orange-300 text-[13px] sm:text-[18px]"
                            >
                                {errors.password?.message || (serverError?.password && serverError.password)}
                            </motion.p>
                            <input type="password" autoComplete="off" {...register("password")} className="w-[250px] sm:w-[350px] md:w-[500px] border-b-2 tracking-wider bg-transparent text-center text-2xl outline-none focus:caret-white" placeholder="Password" />
                        </div>
                        <div className="flex flex-col text-center">
                            <motion.p
                                initial={{ opacity: 0, height: 0}}
                                animate={{ opacity: errors.password2?.message || (serverError?.password2 && serverError.password2) ? 1 : 0, height: errors.password2?.message || (serverError?.password2 && serverError.password2) ? 30 : 0 }}
                                transition={{ duration: .3 }}
                                className="text-orange-300 text-[13px] sm:text-[18px]"
                            >
                                {errors.password2?.message || (serverError?.password2 && serverError.password2)}
                            </motion.p>
                            <input type="password" autoComplete="off" {...register("password2")} className="w-[250px] sm:w-[350px] md:w-[500px] border-b-2 tracking-wider bg-transparent text-center text-2xl outline-none focus:caret-white" placeholder="Confirm Password" />
                        </div>

                        <input type="submit" value="SIGN UP" className="w-[250px] h-[50px] text-2xl tracking-widest rounded border border-[#F5DEB3] bg-[#C2724F] cursor-pointer transition duration-75 ease-in-out hover:bg-[rgba(194,114,79,.7)]" />
                    </form>
                    <div className="flex flex-col text-center gap-2 uppercase text-base tracking-widest">
                        <div>ALREADY REGISTERED? <Link href="/login" className="text-[#F5DEB3] underline transition duration-100 ease-in-out hover:text-[rgba(245,222,179,.7)]">CLICK TO LOG IN</Link></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
