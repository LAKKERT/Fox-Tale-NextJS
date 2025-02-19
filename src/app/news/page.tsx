'use client';
import { Header } from "@/app/components/header";
import { NewsPageComponent } from "@/app/components/news/mainNews";
import { Footer } from "@/app/components/footer";

export default function NewsPage() {
    return (
        <div className="w-full min-h-[calc(100vh-100px)] mt-[100px] bg-black object-cover bg-cover bg-center bg-no-repeat overflow-hidden caret-transparent">
            <Header />
            <NewsPageComponent />
            <Footer />
        </div>
    )
} 