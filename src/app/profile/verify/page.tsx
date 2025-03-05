"use client";
import { Loader } from "@/app/components/load";
import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { useForm } from "react-hook-form";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";


const validationSchema = Yup.object().shape({
    code: Yup.number().min(1000, 'Number must be a 4-digit number').max(9999, 'Number must be a 4-digit number').typeError('Please enter a 4-digit number'),
})

export default function VerifyPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [showContent, setShowContent] = useState(false);
    const [userEmail, setUserEmail] = useState();
    const [serverMessage, setServerMessage] = useState("");
    const [serverError, setServerError] = useState<{code: number | null}>();
    const [cookies] = useCookies(['auth_token']);
    const router = useRouter();

    const { register, handleSubmit, formState: { errors } } = useForm<{code: number}>({
        resolver: yupResolver(validationSchema)
    })

    useEffect(() => {
        const fetchUserEmail = async () => {
            try {
                const response = await fetch('/api/profile/verifyUserAPI', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${cookies.auth_token}`,
                    }
                });

                const result = await response.json();
                
                if (response.ok) {
                    setIsLoading(false);
                    if (result.redirectUrl) {
                        router.push(result.redirectUrl);
                    }else {
                        setUserEmail(result.email.email);
                    }
                } else {
                    console.error("Failed to fetch user data");
                }

                const payload = {
                    cookiesName: 'auth_token',
                    userEmail: result.email.email,
                }
                
                const createCodeResponse = await fetch(`/api/profile/createVerificationCodeAPI`, {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        'Authorization': `Bearer ${cookies['auth_token']}`,
                    },
                    body: JSON.stringify(payload),
                })

                const codeResponse = await createCodeResponse.json();

                if (createCodeResponse.ok) {
                    if (codeResponse.redirectUrl) {
                        router.push(codeResponse.redirectUrl)
                    }
                }else {
                    console.error('Server error occurred');
                }

            }catch (error) {
                console.log(error);
                setServerMessage("An unexpected error occurred.");
            }
        }

        fetchUserEmail();

    }, [router])

    const onSubmit = async (data: {code: number}) => {
        try {
            const payLoad = {
                ...data,
            }

            const response = await fetch('/api/profile/verifyUserAPI', {
                method: 'POST',
                headers: {
                    'content-Type': 'application/json',
                    'Authorization': `Bearer ${cookies['auth_token']}`,
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
            console.log(error);
            setServerMessage("An unexpected error occurred.");
        }
    }

    return (
        <div>
            {isLoading ? (
                <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-black fixed inset-0 flex justify-center items-center"
                >
                    <Loader />
                </motion.div>
            ) : null}

            {!isLoading ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="h-[100vh] w-full bg-[url('/signup/bg-signup.png')] flex justify-center items-center object-cover bg-cover bg-center bg-no-repeat overflow-hidden caret-transparent"
                >

                    <div className="bg-[rgba(6,6,6,.65)] flex flex-col gap-4 py-9 px-5 rounded-lg text-center">
                        <p>the code was sent to the email: {userEmail}</p>
                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col justify-center items-center text-center gap-6">
                            <div className="flex flex-col text-center">
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: errors.code?.message || serverError?.code || serverMessage ? 1 : 0, height: errors.code?.message || serverError?.code || serverMessage ? 30 : 0 }}
                                    transition={{ duration: .3 }}
                                    className="text-orange-300"
                                >
                                    {errors.code?.message || serverError?.code || serverMessage}
                                </motion.p>
                                <input type="text" maxLength={4} autoComplete="off" {...register("code")} className="w-[250px] sm:w-[350px] md:w-[500px] border-b-2 bg-transparent tracking-[25px] text-center text-2xl outline-none caret-white" placeholder="CODE" />
                            </div>
                            <input type="submit" value="VERIFY" className="w-[250px] h-[50px] text-2xl tracking-widest rounded border border-[#F5DEB3] bg-[#C2724F] cursor-pointer transition duration-75 ease-in-out hover:bg-[rgba(194,114,79,.7)]" />
                        </form>
                    </div>
                </motion.div>
            ) : null}
        </div>
    );
}