"use client";
import { Header } from "@/app/components/header";
import { Main } from "./components/home/homePage";

export default function Home() {
    return (
        <div className="bg-black caret-transparent">
            <Header />
            <Main />
        </div>
    );
}
