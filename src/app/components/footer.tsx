import Image from "next/image";
import Link from "next/link";

import { K2D } from "next/font/google";
const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

export function Footer() {
    return (
        <div className={`flex justify-center p-5 bg-black border-t-2 border-[#f5885a]  ${MainFont.className}`}>
            <div className="flex flex-col lg:flex-row items-center gap-5 lg:gap-20">

                <div>
                    <Link href="/">
                        <Image src="/header/logo.svg" alt="Logo" width={100} height={110} />
                    </Link>
                </div>

                <div className="hidden lg:block">
                    <Image src="/footer/line.svg" width={6} height={220} alt="line" />
                </div>
                
                <div className="block lg:hidden">
                    <Image src="/footer/gorizontal-line.svg" width={220} height={6} alt="line"  />
                </div>

                <div className="flex flex-col gap-3 text-xl text-center">
                    <Link href="/news" className="uppercase text-white hover:text-[#f5885a] transition duration-150 ease-in-out">
                        News
                    </Link>

                    <Link href="/support" className="uppercase text-white hover:text-[#f5885a] transition duration-150 ease-in-out">
                        Support
                    </Link>

                    <Link href="/universe" className="uppercase text-white hover:text-[#f5885a] transition duration-150 ease-in-out">
                        Universe
                    </Link>

                    <Link href="/characters" className="uppercase text-white hover:text-[#f5885a] transition duration-150 ease-in-out">
                        Characters
                    </Link>
                </div>

                <div className="hidden lg:block">
                    <Image src="/footer/line.svg" width={6} height={220} alt="line" />
                </div>
                
                <div className="block lg:hidden">
                    <Image src="/footer/gorizontal-line.svg" width={220} height={6} alt="line"  />
                </div>

                <div className="flex flex-col gap-3 text-xl text-center">
                    <h4 className="uppercase text-white underline">Community</h4>
                    <Link href="/" className="uppercase text-white hover:text-[#f5885a] transition duration-150 ease-in-out">
                        VK
                    </Link>

                    <Link href="/" className="uppercase text-white hover:text-[#f5885a] transition duration-150 ease-in-out">
                        Youtube
                    </Link>

                    <Link href="/" className="uppercase text-white hover:text-[#f5885a] transition duration-150 ease-in-out">
                        Discord
                    </Link>
                </div>
            </div>
        </div>
    );
}