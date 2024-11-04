"use client";
import {useState, useEffect} from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import * as Yup from "yup";

const validationSchema = Yup.object().shape({
    title: Yup.string().required('Please enter a title'),
    description: Yup.string().required('Please explain your problem'),

})

export default function CreateSupportChat() {
    const [cookies] = useCookies();
    const router = useRouter();
    
    useEffect(() => {
        if (!cookies.auth_token) {
            router.push('/login')
        }
    }, [cookies]);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
    });

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                cookies: cookies
            }

            const response = await fetch('/api/support/createSupportChatAPI', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            
            if (response.ok) {
                console.log('chat created successfully')
                router.push(result.redirectUrl);
            }else {
                console.log('error creating chat')
            }

        }catch (errors) {
            console.error("Error:", errors);
        }
    }

    return (
        <div>
            <form onSubmit={handleSubmit(onSubmit)}>
                <input type="text" {...register("title")} />
                <input type="text" {...register("description")} />
                <input type="submit" />
            </form>
        </div>
    )
}