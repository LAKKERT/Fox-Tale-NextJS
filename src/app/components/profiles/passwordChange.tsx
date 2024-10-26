"use client";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { motion } from 'framer-motion';

const validationSchema = Yup.object().shape({
    password1: Yup.string().min(6, 'Old password must be at least 6 characters').required('Enter your password'),
    password2: Yup.string().min(6, 'New password must be at least 6 characters').required('Enter your new password'),
    repeatPassword2: Yup.string().oneOf([Yup.ref('password2'), null], 'Passwords must match').required('Repeat your new password'),
})

export function ChangePassword({ userData }) {
    const [successMessage, setSuccessMessage] = useState("");
    const [serverMessage, setServerMessage] = useState("");
    const [serverError, setServerError] = useState({});
    const [clientError, setClientError] = useState({});

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
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
                id: userData.id
            }
            const response = await fetch('/api/profile/changePasswordAPI', {
                method: 'POST',
                headers: {
                    'content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            const result = await response.json();

            if (response.ok) {
                setSuccessMessage(result.message);
                reset();
            } else {
                console.error("Failed to change password");
                setServerMessage(result.message);
                setServerError(result.errors);
            }
        } catch (error) {
            console.error('Error changing password:', error);
        }
    }

    return (
        <div className="w-full flex flex-col lg:flex-row justify-center items-center py-3 lg:py-6  px-4 lg:px-6 gap-3 bg-[#272727] text-center text-white text-lg lg:text-lg text-balance rounded-md lg:rounded-xl">
            <div>
                <p>If you want to change your password, fill out the form</p>
            </div>

            <div className="w-full flex flex-col gap-3">

                <p>Change password</p>
                <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: successMessage ? 1 : 0, height: successMessage ? 30 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-orange-300"
                >
                    {successMessage ? successMessage : ''}
                </motion.p>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 text-balance">
                    <div className="flex flex-col gap-2">
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: errors.password1 || serverError.password1 || serverMessage ? 1 : 0, height: errors.password1 || serverError.password1 || serverMessage ? 30 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="text-orange-300 text-sm sm:text-large"
                        >
                            {clientError.password1?.message || serverError?.password1 || serverMessage}
                        </motion.p>
                        <input type="password" {...register("password1")} placeholder="Current password" className="w-full h-11 bg-[rgba(73,73,73,.56)] rounded text-white text-center outline-[#C67E5F] focus:outline" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <motion.p
                            initial={{ opacity: 0, heigth: 0 }}
                            animate={{ opacity: errors.password2 || serverError.password2 || serverMessage ? 1 : 0, height: errors.password2 || serverError.password2 || serverMessage ? 30 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="text-orange-300 text-[13px] sm:text-large"
                        >
                            {clientError.password2?.message || serverError?.password2 || serverMessage}
                        </motion.p>
                        <input type="password" {...register("password2")} placeholder="New password" className="w-full h-11 bg-[rgba(73,73,73,.56)] rounded text-white text-center outline-[#C67E5F] focus:outline" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: errors.repeatPassword2 || serverError ? 1 : 0, height: errors.repeatPassword2 || serverError?.repeatPassword2 ? 30 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="text-orange-300 text-sm sm:text-large"
                        >
                            {errors.repeatPassword2?.message || serverError?.repeatPassword2}
                        </motion.p>
                        <input type="password" {...register("repeatPassword2")} placeholder="Repeat new password" className="w-full h-11 bg-[rgba(73,73,73,.56)] rounded text-white text-center outline-[#C67E5F] focus:outline" />
                    </div>
                    <input type="submit" value="Save changes" className="w-full h-11 bg-[#C67E5F] hover:bg-[rgba(198,126,95,.80)] rounded text-white text-center cursor-pointer transition-all duration-150 ease-in-out" />
                </form>
            </div>
        </div>
    );
}