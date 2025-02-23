'use client';
import { Header } from "@/app/components/header";
import { RequestsHistoryComponent } from "@/app/components/support/RequestsHistoryComponent";

import { K2D } from "next/font/google";
const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

export default function RequestsHistoryPage() {
    return (
        <div className={`w-full ${MainFont.className} caret-transparent`}>
            <Header />
            <RequestsHistoryComponent />
        </div>
    );
}