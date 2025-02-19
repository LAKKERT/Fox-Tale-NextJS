'use client';
import { Header } from '@/app/components/header';
import { RequestsListComponent } from '@/app/components/support/requestsList';

import { K2D } from "next/font/google";
const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

export default function AllSupporRequests() {
    return (
        <div className={`w-full h-full bg-[url('/login/gradient_bg.png')] object-cover bg-cover bg-center bg-no-repeat overflow-hidden ${MainFont.className} caret-transparent`}>
            <Header />
            <RequestsListComponent />
        </div>
    );
}