"use client";
import { Loader } from "@/app/components/load";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { useRouter } from "next/navigation";
import { useCookies } from "react-cookie";
import Cookies from "js-cookie";
import { motion } from "framer-motion";

import { getRegistrationUserData } from "@/pages/api/profile/verifyUserAPI";
import { createVerificationCode } from "@/pages/api/profile/verifyUserAPI";

const validationCode = Yup.object().shape({
    code: Yup.number().min(1000, 'Number must be a 4-digit number').max(9999, 'Number must be a 4-digit number').typeError('Please enter a 4-digit number'),
})

export default function EmailVerification() {
    const [isLoading, setIsLoading] = useState(true);
    const [showContent, setShowContent] = useState(false);
    const [userData, setUserData] = useState(null);
    const [serverError, setServerError] = useState(null);
    const [clientError, setClientError] = useState({});
    const [cookies] = useCookies(['regToken'])
    const router = useRouter();

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(validationCode),
    });

    useEffect(() => {
        const timeout = setTimeout(() => {
            setIsLoading(false);
            setTimeout(() => setShowContent(true), 300);
        }, 300);

        return () => clearTimeout(timeout);
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
                cookies
            }

            const response = await fetch('/api/users/verifyEmailAPI', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            })

            const result = await response.json();

            if (response.ok) {
                router.push(result.redirectUrl);
            } else {
                setServerError(result.message);
                console.error('Error:', result.message);
                router.push(result.redirectUrl);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    useEffect(() => {
        const verifyAndFetchData = async () => {
            if (cookies.regToken) {
                try {
                    await createVerificationCode(cookies);
                    const data = await getRegistrationUserData(cookies);
                    setUserData(data)
                } catch (error) {
                    console.error('Error creating verification code:', error);
                }
            } else {
                router.push('/');
            }
        };

        verifyAndFetchData();

        window.history.pushState({ page: 'emailVerify' }, '', window.location.href);

        const handleOnBeforeUnload = async (event) => {
            event.preventDefault();
            event.returnValue = 'Are you sure you want to leave?';
            try {
                const response = await fetch('/api/users/verifyEmailAPI', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(cookies),
                })

                const result = await response.json();

                if (response.ok) {
                    Cookies.remove('regToken');
                    router.push('/signup');
                } else {
                    console.error('Error:', result.message);
                }

            } catch (error) {
                console.error('Error:', error);
            }
        }

        window.history.pushState({ page: 'emailVerify' }, '', window.location.href);
        const handlePopState = async (event) => {
            try {
                const response = await fetch('/api/users/verifyEmailAPI', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(cookies),
                });

                const result = await response.json();
                if (response.ok) {
                    Cookies.remove('regToken');
                    router.push('/signup');
                } else {
                    console.error('Error:', result.message);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };

        window.addEventListener('popstate', handlePopState);
        window.addEventListener('beforeunload', handleOnBeforeUnload);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('beforeunload', handleOnBeforeUnload);
        }
    }, [cookies, router]);

    return (
        <div>
            {isLoading ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="h-full w-full bg-[rgba(0,0,0,.65)] rounded-lg flex flex-col items-center justify-center text-white"
                >
                    <Loader />
                </motion.div>
            ) : null}

            {showContent ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="h-[100vh] w-full bg-[url('/signup/bg-signup.png')] flex justify-center items-center object-cover bg-cover bg-center bg-no-repeat overflow-hidden"
                >

                    <div className="h-[100vh] w-full bg-[url('/signup/bg-signup.png')] flex justify-center items-center object-cover bg-cover bg-center bg-no-repeat overflow-hidden">
                        <div className="bg-[rgba(6,6,6,.65)] flex flex-col gap-4 py-9 px-5 rounded-lg text-center">
                            <p>the code was sent to the email: {userData?.email}</p>
                            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col justify-center items-center text-center gap-6">
                                <div className="flex flex-col text-center">
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: errors.code?.message || serverError ? 1 : 0, height: errors.code?.message || serverError ? 30 : 0 }}
                                        transition={{ duration: .3 }}
                                        className="text-orange-300 text-[13px] sm:text-[18px]"
                                    >
                                        {errors.code?.message || serverError}
                                    </motion.p>
                                    <input type="text" maxLength={4} autoComplete="off" {...register("code")} className="w-[250px] sm:w-[350px] md:w-[500px] border-b-2 bg-transparent tracking-[25px] text-center text-2xl outline-none" placeholder="CODE" />
                                </div>
                                <input type="submit" value="SIGN UP" className="w-[250px] h-[50px] text-2xl tracking-widest rounded border border-[#F5DEB3] bg-[#C2724F] cursor-pointer transition duration-75 ease-in-out hover:bg-[rgba(194,114,79,.7)]" />
                            </form>
                        </div>
                    </div>
                </motion.div>
            ) : null}
        </div>
    );
}
