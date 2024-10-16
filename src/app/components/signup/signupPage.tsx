"use client";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { useRouter } from "next/navigation";

import Link from "next/link";
import { K2D } from "next/font/google";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

const validationSchema = Yup.object().shape({
    email: Yup.string().email('EMAIL is not correct').required('Enter your EMAIL'),
    username: Yup.string().min(4, 'Username must be at least 4 characters').required('Enter your username'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Enter your password'),
    password2: Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match').required('Confirm your password'),
});

export function SignUpPage() {
    const router = useRouter();
    const [serverMessage, setServerMessage] = useState("");
    const [serverError, setServerError] = useState("");
    
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
    });

    const onSubmit = async (data) => {
        try {
            const response = await fetch('/api/users/signupAPI', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            console.log(result);

            if (response.ok) {
                console.log("User created successfully!");
                router.push(result.redirectUrl);
            } else {
                console.error("Failed to create user");
                setServerError(result.errors);
                setServerMessage(result.message);
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
                <div className="w-[290px] h-auto sm:w-[500px] md:w-[730px] flex flex-col justify-center items-center gap-3 md:gap-8 px-6 md:px-[100px] py-[20px] bg-[rgba(6,6,6,.65)] rounded-lg">
                    <div className="sm:text-2xl text-center">FIRST, LET’S GET YOUR INFO</div>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col items-center gap-8 md:gap-12">
                        <div className="flex flex-col text-center">
                            <p>{errors.email?.message || (serverMessage && serverMessage.includes("Email") ? serverMessage : '')}</p>
                            <input type="email" autoComplete="off" {...register("email")} className="w-[250px] sm:w-[350px] md:w-[500px] border-b-2 tracking-wider bg-transparent text-center text-2xl outline-none" placeholder="Enter email here"/>
                        </div>
                        <div className="flex flex-col text-center">
                            <p>{errors.username?.message || (serverError?.username && serverError.username)}</p>
                            <input type="text" autoComplete="off" {...register("username")} className="w-[250px] sm:w-[350px] md:w-[500px] border-b-2 tracking-wider bg-transparent text-center text-2xl outline-none" placeholder="LOGIN"/>
                        </div>
                        <div className="flex flex-col text-center">
                            <p>{errors.password?.message || (serverError?.password && serverError.password)}</p>
                            <input type="password" autoComplete="off" {...register("password")} className="w-[250px] sm:w-[350px] md:w-[500px] border-b-2 tracking-wider bg-transparent text-center text-2xl outline-none" placeholder="PASSWORD" />
                        </div>
                        <div className="flex flex-col text-center">
                            <p>{errors.password2?.message || (serverError?.password2 && serverError.password2)}</p>
                            <input type="password" autoComplete="off" {...register("password2")} className="w-[250px] sm:w-[350px] md:w-[500px] border-b-2 tracking-wider bg-transparent text-center text-2xl outline-none" placeholder="CONFIRM PASSWORD" />
                        </div>
                        
                        <input type="submit" value="SIGN UP" className="w-[250px] h-[50px] text-2xl tracking-widest rounded border border-[#F5DEB3] bg-[#C2724F] cursor-pointer transition duration-75 ease-in-out hover:bg-[rgba(194,114,79,.7)]" />
                    </form>
                    <div className="flex flex-col text-center gap-2 uppercase text-base tracking-widest">
                        <div>ALREADY REGISTERED? <Link href="/" className="text-[#F5DEB3] underline transition duration-100 ease-in-out hover:text-[rgba(245,222,179,.7)]">CLICK TO LOG IN</Link></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
