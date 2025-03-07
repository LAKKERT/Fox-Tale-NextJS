'use client';

import { Loader } from "@/app/components/load";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { K2D } from "next/font/google";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

interface charactersType {
    id: number;
    name: string;
    description: string;
    cover: string;
}

export function CharacretsPageComponent() {
    const [isLoading, setIsLoading] = useState(true);
    const [charactersData, setcharactersData] = useState<charactersType[]>([])

    const router = useRouter();

    useEffect(() => {
        const fetchCharactersData = async () => {
            try {
                const response = await fetch('/api/characters/fetchAllCharacters', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })

                const result = await response.json();

                if (response.ok) {
                    setcharactersData(result.data);
                    setIsLoading(false);
                } else {
                    console.error(`Error fetching data`);
                }
            } catch (error) {
                console.error(`Error fetching data: ${error}`);
            }
        }

        fetchCharactersData();
    }, [router])

    return (
        <div className={`min-h-[calc(100vh-100px)] flex flex-col items-center gap-4 mx-auto ${MainFont.className} text-[#F5DEB3] caret-transparent`}>
            {isLoading ? (
                <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: .3 }}
                    className=" bg-black fixed inset-0 flex justify-center items-center"
                >
                    <Loader />
                </motion.div>
            ) : (
                <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`max-w-xl sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl w-full mx-auto ${MainFont.className} text-white bg-black py-4`}
                >
                    <div className="flex flex-col items-center gap-4">

                        <h1 className="uppercase text-3xl">
                            CHARACTERS
                        </h1>

                        <div className="w-full flex flex-row flex-wrap gap-4 justify-center ">
                            {charactersData.map((item, i) => {
                                return (
                                    <div key={i} className="relative group">
                                        <Link href={`/characters/${item.id}` }>
                                            <motion.div
                                                whileTap={{ scale: 0.95 }}
                                                className="relative w-[250px] h-[345px] bg-white rounded shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                                                whileHover="hover"
                                            >
                                                <Image
                                                    src={`http://localhost:3000/${item.cover}`}
                                                    alt="Place Cover"
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 50vw"
                                                    className="object-cover object-center"
                                                    quality={100}
                                                />

                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <p className="uppercase text-2xl text-white z-10 drop-shadow-lg">
                                                        {item.name}
                                                    </p>
                                                </div>

                                                <motion.div
                                                    variants={{ hover: { opacity: 0.3 } }}
                                                    className="absolute inset-0 bg-black/0"
                                                />

                                                <motion.div
                                                    variants={{
                                                        hover: {
                                                            opacity: 1,
                                                            y: 0,
                                                            transition: {
                                                                delay: 0.1,
                                                                duration: 0.3
                                                            }
                                                        }
                                                    }}
                                                    initial={{ opacity: 0, y: 50 }}
                                                    className="absolute bottom-0 w-full bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4"
                                                >
                                                    <div className="flex w-full items-center justify-between text-white">
                                                        <span className="text-lg">Read more</span>
                                                        <motion.div
                                                            variants={{
                                                                hover: { x: 5 },
                                                            }}
                                                            className="w-6 h-6"
                                                        >
                                                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </motion.div>
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                        </Link>
                                    </div>
                                )
                            })}
                        </div>

                    </div>
                </motion.div>)}
        </div>
    )
}