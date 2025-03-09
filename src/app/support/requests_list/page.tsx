'use client';
import { Header } from '@/app/components/header';
import { RequestsListComponent } from '@/app/components/support/requestsList';
import Image from 'next/image';

export default function AllSupporRequests() {
    return (
        <div className={`min-h-[calc(100vh-100px)] mt-[100px]`}>
            <div className="fixed inset-0 -z-10">
                <Image
                    src="/login/gradient_bg.png"
                    alt="background"
                    className="w-full h-full object-cover"
                    fill
                />
            </div>
            
            <div className="flex flex-col">
                <Header />
                <RequestsListComponent />
            </div>
        </div>
    );
}