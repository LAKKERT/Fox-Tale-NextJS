"use client";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { motion } from "framer-motion";

const validationSchema = Yup.object().shape({
    newEmail: Yup.string().email('Email is not correct').required('Enter your new email'),
})

const codeValidationSchema = Yup.object().shape({
    code: Yup.number().min(1000, 'Number must be a 4-digit number').max(9999, 'Number must be a 4-digit number').typeError('Please enter a 4-digit number'),
})

function maskEmail(email) {
    const index = email?.indexOf("@");

    const visiblePart = email?.slice(0, index - 4);
    const hiddenPart = "*".repeat(4);
    const domain = email?.slice(index);

    return `${visiblePart}${hiddenPart}${domain}`;
}

export function EmailChange({ userData }) {
    const [ isCodeGenerated, setIsCodeGenerated] = useState(false);
    const [codeIncorrect, setCodeIncorrect] = useState("");
    const [serverMessage, setServerMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("")
    const [clientError, setClientError] = useState({});
    const [serverError, setServerError] = useState({});
    const [newEmail, setNewEmail] = useState("");

    const maskedEmail = maskEmail(userData?.email);

    const {register, handleSubmit, reset, formState: { errors }} = useForm({
        resolver: yupResolver(validationSchema)
    });

    const { register: registerCode, handleSubmit: handleSubmitCode, formState: { errors: errorsCode } } = useForm({
        resolver: yupResolver(codeValidationSchema)
    });

    useEffect(() => {
        if (errors) {
            setClientError(errors);
        }else {
            const timeout = setTimeout(() => {
                setClientError(errors);
                return () => clearTimeout(timeout);
            }, 300)
        }


    }, [errors, errorsCode]);

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                id: userData.id
            }
            
            const response = await fetch('/api/profile/changeEmailAPI', {
                method: 'POST',
                headers: {
                    'content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok) {
                setIsCodeGenerated(true);
                setServerMessage('');
                setNewEmail(result.email);
            } else {
                setServerMessage(result.emailExistMessage);
                console.error("Failed to change email");
            }

        }catch (error) {
            console.error(error);
        }
    }

    const onSubmitSecondForm = async (data) => {
        const payload = {
            ...data,
            id: userData.id,
            newEmail
        }
        try {
            const response = await fetch('/api/profile/changeEmailAPI', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify(payload)
            })

            const result = await response.json();

            if (response.ok) {
                setSuccessMessage(result.successMessage);
                setIsCodeGenerated(false);
                reset();
            } else {
                setCodeIncorrect(result.codeIncorrectMessage);
                setServerError(result.errors);
                console.error("Failed to verify email code");
            }

        }catch (error) {
            console.error(error);
        }
    }

    if (!userData) {
        return <p>Loading email data...</p>;
    }

    return (
        <div className="w-full flex flex-col lg:flex-row justify-center items-center py-3 lg:py-6  px-4 lg:px-6 gap-3 bg-[#272727] text-center text-lg lg:text-lg text-balance rounded-md lg:rounded-xl">
            <div>
                <p>If you want to change your Email, fill out the form</p>
            </div>

            <div className="w-full flex flex-col gap-3">
                <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: successMessage ? 1 : 0, height: successMessage ? 30 : 0 }}
                    transition={{ duration: .3 }}
                    className="text-orange-300 text-[13px] sm:text-[18px]"
                >
                    {successMessage}
                </motion.p>
                <p >Your email: {maskedEmail}</p>
                <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: clientError.newEmail?.message || serverError?.newEmail || serverMessage ? 1 : 0, height: clientError.newEmail?.message || serverError?.newEmail || serverMessage ? 30 : 0}}
                        transition={{ duration: .3}}
                        className="text-orange-300 text-[13px] sm:text-[18px]"
                    >
                        {clientError.newEmail?.message || serverError?.newEmail || serverMessage }
                    </motion.p>
                    <input type="email" {...register("newEmail")} placeholder="New email" disabled={isCodeGenerated} className="w-full h-11 bg-[rgba(73,73,73,.56)] rounded text-white text-center outline-[#C67E5F] focus:outline" />
                    <motion.input
                        initial={{ height: 44 }}
                        animate={{ height: isCodeGenerated ? 0 : 44}}
                        transition={{ duration: .1}}
                        value="Confirm"
                        type="submit"
                        className={`w-full bg-[#C67E5F] hover:bg-[rgba(198,126,95,.80)] rounded text-white text-center cursor-pointer transition-all duration-150 ease-in-out `}
                    >

                    </motion.input>
                </form>

                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: isCodeGenerated ? 200 : 0}}
                    transition={{ duration: .3}}
                    className="w-full px-[1px] overflow-hidden"
                >
                    <form className="flex flex-col gap-3" onSubmit={handleSubmitCode(onSubmitSecondForm)}>
                        <p className="flex items-center justify-center w-full h-11 rounded text-white text-center">Code from: {maskedEmail}</p>
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: errorsCode.code?.message || serverError?.code || codeIncorrect ? 1 : 0, height: errorsCode.code?.message || serverError?.code || codeIncorrect ? 30 : 0}}
                            transition={{ duration: .3}}
                            className="text-orange-300 text-[13px] sm:text-[18px]"
                        >
                            { errorsCode.code?.message || serverError?.code || codeIncorrect }
                        </motion.p>
                        
                        <input type="text" {...registerCode("code")} maxLength={4} placeholder="Code" className="w-full h-11 bg-[rgba(73,73,73,.56)] rounded text-white text-center outline-[#C67E5F] focus:outline" />
                        <input type="submit" value="Save changes" className="w-full h-11 bg-[#C67E5F] hover:bg-[rgba(198,126,95,.80)] rounded text-white text-center cursor-pointer transition-all duration-150 ease-in-out" />
                    </form>
                </motion.div>
            </div>
        </div>
    );
}