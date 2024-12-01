'use client'

import { Header } from "@/app/components/header";
import { Loader } from "@/app/components/load";
import Image from "next/image";
import { K2D } from "next/font/google";
import styles from "@/app/styles/home/variables.module.scss";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

export function CreatePageComponent() {
    return (
        <div className={`lg:max-w-8xl mx-auto mt-[100px] ${MainFont.className} text-white `}>
            
        </div>
    )
}