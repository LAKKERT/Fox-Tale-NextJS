'use client';
import { Header } from "@/app/components/header";
import { Loader } from "@/app/components/load";
import { RequestsHistoryComponent } from "@/app/components/support/RequestsHistoryComponent";
import { useState, useEffect } from "react";

import { K2D } from "next/font/google";
const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

export default function RequestsHistoryPage() {
    return (
        <div className={`w-full h-full bg-[url('/login/gradient_bg.png')] object-cover bg-cover bg-center bg-no-repeat overflow-hidden ${MainFont.className}`}>
            <Header />
            <RequestsHistoryComponent />
        </div>
    );
}