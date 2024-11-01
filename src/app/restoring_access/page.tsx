"use client";
import { Loader } from "@/app/components/load";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { motion } from "framer-motion";
import { K2D } from "next/font/google";
import Image from "next/image";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

const validationSchema = Yup.object().shape({
    email: Yup.string().email('Email is not correct').required('Enter your email'),
})

export default function SendRequest() {
    const [isLoading, setIsLoading] = useState(true);
    const [showContent, setShowContent] = useState(false);

    const [clientChoice, setClientChoice] = useState("");
    const [backButton, setBackButton] = useState(false);

    const [clientError, setClientError] = useState({});
    const [serverError, setServerError] = useState({});
    const [serverMessage, setServerMessage] = useState("");

    const [cookies] = useCookies();
    const router = useRouter();

    useEffect(() => {
        if (cookies.auth_token) {
            router.push('/');
        }
    }, [cookies]);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema)
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

    function backFunc() {
        setBackButton(true);
        const timeout = setTimeout(() => {
            setBackButton(false);
            setClientChoice("");
            return () => clearTimeout(timeout);
        }, 300);
    }

    function forgetLogin() {
        setClientChoice('forgetLogin');
    }

    function forgetPassword() {
        setClientChoice('forgetPassword');
    }

    const onSubmit = async (data) => {
        console.log(data);
        try {
            const payload = {
                ...data,
                clientChoice: clientChoice
            }
            console.log(payload);

            const response = await fetch('/api/users/userDataReset/userDataResetAPI', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            const result = await response.json();

            if (response.ok) {
                setServerMessage(result.message);
                reset();
                console.log("Email sent successfully");
            } else {
                setServerError(result.errors)
                console.error("Failed to send email");
            }

        } catch (errors) {
            console.error(errors);
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

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={`relative h-[100vh] w-full bg-[url('/signup/bg-signup.png')] flex justify-center items-center object-cover bg-cover bg-center bg-no-repeat overflow-hidden text-white ${MainFont.className}`}
            >
                <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ transform: !clientChoice || backButton ? "translateX(0px)" : "translateX(-1000px)", opacity: !clientChoice || backButton ? 1 : 0 }}
                    className="absolute w-[290px] h-[320px] sm:w-[500px] sm:h-[300px] md:w-[730px] md:h-[330px] flex flex-col items-center justify-center px-6 py-5 md:px-[100px] bg-[rgba(6,6,6,.65)] rounded-lg select-none"
                    transition={{ duration: 1 }}
                >

                    <div className="text-center text-balance flex flex-col gap-3">
                        <h2 className="text-xl md:text-2xl tracking-wider uppercase">- restoring access -</h2>
                        <p className="md:text-lg">If you're having trouble accessing your account, please select one of the options below</p>
                    </div>

                    <div className="h-full w-full flex flex-col justify-center items-center gap-5">
                        <button onClick={forgetLogin} className={`w-full h-11 bg-[#C67E5F] hover:bg-[rgba(198,126,95,.80)] rounded text-white text-center cursor-pointer transition-all duration-150 ease-in-out uppercase ${!clientChoice ? "pointer-events-auto" : "pointer-events-none"}`}>Forget Login</button>
                        <button onClick={forgetPassword} className={`w-full h-11 bg-[#C67E5F] hover:bg-[rgba(198,126,95,.80)] rounded text-white text-center cursor-pointer transition-all duration-150 ease-in-out uppercase ${!clientChoice ? "pointer-events-auto" : "pointer-events-none"}`}>Forget password</button>
                    </div>

                </motion.div>

                <motion.div
                    initial={{ opacity: 0, }}
                    animate={{
                        transform: !clientChoice || backButton ? "translateX(1000px)" : "translateX(0px)",
                        opacity: !clientChoice || backButton ? 0 : 1,

                    }}
                    transition={{ duration: 1 }}
                    className="absolute w-[290px] h-[320px] sm:w-[500px] sm:h-[300px] md:w-[730px] md:h-[330px] flex flex-col items-center  gap-6 px-6 py-5 md:px-[50px] bg-[rgba(6,6,6,.65)] rounded-lg select-none text-white"
                >
                    <div className="relative w-full text-center text-balance flex flex-col gap-3">
                        <button className="absolute hidden sm:block top-2 left-0" onClick={backFunc}><Image src={"/recovery/back_arrow.svg"} alt="back" width={25} height={20}></Image></button>
                        <h2 className="text-xl md:text-2xl tracking-wider uppercase">- {clientChoice === 'forgetPassword' ? "Password recovery" : "Login recovery"} -</h2>
                        <p className="md:text-lg">Enter the email address linked to your account, and check your inbox</p>
                    </div>

                    <div className="w-full px-4">
                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 text-balance">
                            <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: clientError.email?.message || serverError?.email || serverMessage ? 1 : 0, height: clientError.email?.message || serverError?.email || serverMessage ? 30 : 0 }}
                                transition={{ duration: .3 }}
                                className="text-center text-orange-300 text-[13px] sm:text-[18px]"
                            >
                                {clientError.email?.message || serverError?.email || serverMessage}
                            </motion.p>
                            <input type="email" disabled={!clientChoice} {...register("email")} placeholder="Your email" className={`w-full h-11 bg-[rgba(73,73,73,.56)] rounded text-white text-center outline-[#C67E5F] focus:outline `} />
                            <input type="submit" disabled={!clientChoice} value="submit" className={`w-full h-11 bg-[#C67E5F] hover:bg-[rgba(198,126,95,.80)] rounded text-white text-center cursor-pointer transition-all duration-150 ease-in-out uppercase ${!clientChoice ? "pointer-events-none" : "pointer-events-auto"}`} />
                        </form>
                    </div>
                </motion.div>
            </motion.div>

        </div>
    );
}