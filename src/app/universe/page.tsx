'use client';
import { Header } from "@/app/components/header";
import { UniversePageComponent } from '@/app/components/universe/mainUniversePageComponent';
import { Footer } from "@/app/components/footer";

export default function UniversePage() {

    return (
        <div className="w-full min-h-[calc(100vh-100px)] mt-[100px] bg-black object-cover bg-cover bg-center bg-no-repeat overflow-hidden caret-transparent">
            <Header />
            <UniversePageComponent />
            <Footer />
        </div>
    )
}
