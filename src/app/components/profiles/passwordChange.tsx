"use client";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { useForm } from "react-hook-form";
import { useState } from "react";

const validationSchema = Yup.object().shape({
    // password1: Yup.string().min(6, 'Old password must be at least 6 characters').required('Enter your password'),
    password2: Yup.string().min(6, 'New password must be at least 6 characters').required('Enter your new password'),
    repeatPassword2: Yup.string().oneOf([Yup.ref('password2'), null], 'Passwords must match').required('Repeat your new password'),
})

export function ChangePassword({ userData }) {
    const [successMessage, setSuccessMessage] = useState("");
    const [serverMessage, setServerMessage] = useState("");
    const [serverError, setServerError] = useState({});

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema)
    });

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
            console.log(result);

            if (response.ok) {
                console.log("Password changed successfully!");
                setSuccessMessage(result.message);
                console.log("123123222",successMessage)
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
        <div className="w-full flex flex-col lg:flex-row justify-center items-center py-3 lg:py-6  px-4 lg:px-6 gap-3 bg-[#272727] text-center text-lg lg:text-lg text-balance rounded-md lg:rounded-xl">
            <div>
                <p>If you want to change your password, fill out the form</p>
            </div>

            <div className="w-full flex flex-col gap-3">
            <p>{successMessage ? successMessage : "Change password" }</p>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 transition-all duration-300 ease-in-out text-balance">
                    <div className="flex flex-col gap-2">
                        <p className={`transition-all duration-300 ease-in-out ${errors.password1 || serverError ||serverMessage ? "h-auto opacity-100" : "max-h-0 opacity-0"}`}>{errors.password1?.message || serverError?.password1 || serverMessage}</p>
                        <input type="password" {...register("password1")} placeholder="Current password" className="w-full h-11 bg-[rgba(73,73,73,.56)] rounded text-white text-center outline-[#C67E5F] focus:outline" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className={`transition-all duration-300 ease-in-out ${errors.password2 || serverError ? "h-auto opacity-100" : "max-h-0 opacity-0"}`}>{errors.password2?.message || serverError?.password2}</p>
                        <input type="password" {...register("password2")} placeholder="New password" className="w-full h-11 bg-[rgba(73,73,73,.56)] rounded text-white text-center outline-[#C67E5F] focus:outline" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className={`transition-all duration-300 ease-in-out ${errors.repeatPassword2 || serverError ? "h-auto opacity-100" : "max-h-0 opacity-0"}`}>{errors.repeatPassword2?.message || serverError?.repeatPassword2}</p>
                        <input type="password" {...register("repeatPassword2")} placeholder="Repeat new password" className="w-full h-11 bg-[rgba(73,73,73,.56)] rounded text-white text-center outline-[#C67E5F] focus:outline" />
                    </div>
                    <input type="submit" value="Save changes" className="w-full h-11 bg-[#C67E5F] hover:bg-[rgba(198,126,95,.80)] rounded text-white text-center cursor-pointer transition-all duration-150 ease-in-out" />
                </form>
            </div>
        </div>
    );
}