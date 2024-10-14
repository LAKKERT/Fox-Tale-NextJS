"use client";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { K2D } from "next/font/google";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

export function LoginPage() {
    const {register, handleSubmit} = useForm();

    const onSubmit = async(data) => {
        console.log("send",data);
        try {
            const response = await fetch('/api/users/loginAPI', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })

            const result = await response.json();

            if (response.ok) {
                console.log("Loged in successfully");
            }else {
                console.log('Failed to log in:');
            }

        } catch (error) {
            console.error('Error logging in:', error);
        }
    }
    return (
        <div className={`h-[90vh] w-full mt-[100px] flex flex-col justify-center items-center gap-2 ${MainFont.className} text-white `}>
            <h1 className="uppercase  text-4xl drop-shadow-[4px_4px_2px_rgba(0,0,0,0.5)]">LOG IN</h1>
            <div className="w-[290px] h-[330px] sm:w-[500px] md:w-[730px] md:h-[429px] flex flex-col justify-center items-center gap-3 md:gap-12 px-6 md:px-[100px] py-[20px] bg-[rgba(6,6,6,.65)] rounded-lg">
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col items-center gap-8 md:gap-12">
                    <input type="text" {...register("username")} className="w-[250px] sm:w-[350px] md:w-[500px] border-b-2 tracking-wider bg-transparent text-center text-2xl outline-none " placeholder="LOGIN"/>
                    <input type="password" {...register("password")} className="w-[250px] sm:w-[350px] md:w-[500px] border-b-2 tracking-wider bg-transparent text-center text-2xl outline-none" placeholder="PASSWORD" />
                    <input type="submit" value="LOG IN" className="w-[250px] h-[50px] text-lg tracking-wider rounded border border-[#F5DEB3] bg-[#C2724F]" />
                </form>
                <div className="flex flex-col text-center gap-2 uppercase text-base underline tracking-widest">
                    <Link href="/">CAN’N LOG IN</Link>
                    <Link href="/">CREATE ACCOUNT</Link>
                </div>
            </div>
        </div>
    );
}