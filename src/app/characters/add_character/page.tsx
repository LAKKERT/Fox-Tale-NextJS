'use client';
import { Header } from "@/app/components/header";
import { AddCharacter } from '@/app/components/characters/addCharacterComponent';
import { Footer } from "@/app/components/footer";

export default function UniversePage({params}) {
    return (
        <div className="w-full min-h-[calc(100vh-100px)] mt-[100px] bg-black object-cover bg-cover bg-center bg-no-repeat overflow-hidden caret-transparent">
            <Header />
            <AddCharacter params={params} />
            <Footer />
        </div>
    )
}