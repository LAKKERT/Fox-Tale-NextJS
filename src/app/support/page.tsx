'use client';

import { Header } from "@/app/components/header";
import { SupportPageComponent } from "../components/support/suppurtPage";

export default function SupportPage() {

    return (
        <div className="w-full min-h-[calc(100vh-100px)]  mt-[100px] bg-[url('/login/gradient_bg.png')] object-cover bg-cover bg-center bg-no-repeat overflow-hidden caret-transparent">
            <Header />
            <SupportPageComponent />
        </div>
    )
}