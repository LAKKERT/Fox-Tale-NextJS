'use client';
import { Header } from "@/app/components/header";
import { Loader } from "@/app/components/load";
import { NewsPageComponent } from "@/app/components/mainNews";
import Image from "next/image";
import { K2D } from "next/font/google";
import styles from "@/app/styles/home/variables.module.scss";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

export default function NewsPage() {
    
    return (
        <div className="bg-black text-white">

        </div> 
    )
} 