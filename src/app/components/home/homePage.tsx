"use client";
import { Loader } from "@/app/components/load";
import { Footer } from "@/app/components/footer";
import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import Image from "next/image";
import { PT_Serif } from "next/font/google";
import { K2D } from "next/font/google";
import styles from "@/app/styles/home/variables.module.scss";
import Link from "next/link";
import { supabase } from "@/lib/supabase/supabaseClient";

const introductionFont = PT_Serif({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
})

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

type NewsItems = {
    id: number;
    title: string;
    description: string;
    add_at: string;
}

export function Main() {
    const [isLoading, setIsLoading] = useState(true);
    const [newsItems, setNewsItems] = useState<NewsItems[]>([]);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                if (process.env.NEXT_PUBLIC_ENV === "production") {
                    const {data, error} = await supabase
                        .from('news')
                        .select('id, title, description, add_at')
                        .order('add_at', {ascending: false})
                        .limit(3);
                    if (error) console.error('error occured', error)
                    if (data) {
                        setNewsItems(data);
                        setTimeout(() => {
                            setIsLoading(false);
                        }, 300)
                    }
                }else {
                    const response = await fetch(`/api/news/fetchLatestNews`, {
                        method: "GET",
                        headers: {
                            'Content-type': 'application/json'
                        }
                    })
    
                    const result = await response.json();
    
                    if (response.ok) {
                        setNewsItems(result.result);
                        setTimeout(() => {
                            setIsLoading(false);
                        }, 300)
    
                    } else {
                        console.error("Failed to fetch news");
                    }
                }
            } catch (error) {
                console.error("Error fetching news:", error);
            }
        }

        fetchNews();
    }, [])

    return (
        <div data-testid="custom-element">
            {isLoading ? (
                <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-black fixed inset-0 flex justify-center items-center"
                >
                    <Loader />
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`lg:max-w-8xl mx-auto mt-[100px] ${MainFont.className} text-white bg-black`}
                >
                    <video width={1280} height={902} controls-none="false" autoPlay muted className="w-full h-auto lg:h-[555px] pointer-events-none">
                        <source src="/home/introduction_logo.mp4" type="video/mp4" />
                    </video>

                    <div className="w-full min-h-[364px] bg-[#f5885a]">
                        <div className="uppercase text-3xl py-2 text-white text-center">- MAIN NEWS -</div>

                        <div className={`flex flex-col items-center md:flex-row gap-8 sm:mx-auto md:w-[732px] xl:w-auto xl:justify-center overflow-x-auto ${styles.custom_scroll}`}>

                            {newsItems.map((item, item_id) => (
                                <div key={item_id} className="relative py-2 px-4 sm:p-4 w-[320px] h-[190px] sm:w-[350px] sm:h-[220px]">
                                    <Image src="/home/outline_card.svg" alt="outline" width={100} height={100} className="absolute inset-0 w-full h-full pointer-events-none z-[1] " />
                                    <div className="relative flex flex-col bg-[#d8b5a3] md:min-w-[318px] h-full z-[0] rounded">
                                        <div className="text-center uppercase py-2 text-lg font-light">{item?.title}</div>
                                        <div className="text-base px-2 h-auto">
                                            <p className='line-clamp-4 sm:line-clamp-5'>{item?.description}</p>
                                        </div>
                                        <div className="flex justify-between items-end mt-auto px-2 pb-2">
                                            <p className="text-sm">
                                                {new Date(item?.add_at).toLocaleString("ru-RU", {
                                                    dateStyle: 'short'
                                                })}
                                            </p>
                                            <Link
                                                href={`/news/${item.id}`}
                                                className="uppercase flex items-center gap-1"
                                            >
                                                more •
                                                <Image
                                                    src="/home/Arrow.svg"
                                                    alt="arrow"
                                                    width={25}
                                                    height={25}
                                                    className="mt-[2px]"
                                                />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-row items-center justify-end">
                            <Link href="/news" className="flex flex-row items-center justify-end gap-2 uppercase text-xl py-2 px-4 mr-4 mt-4 mb-4 text-white text-center rounded hover:bg-[#C2724F] transition duration-150 ease-in-out">
                                All news •
                                <Image src="/home/Arrow.svg" alt="arrow" width={25} height={25} className="mt-1" />
                            </Link>
                        </div>
                    </div>

                    <div className={`relative`}>

                        <video width={1280} controls-none="false" autoPlay loop muted className="w-full relative hidden md:block opacity-50 xl:opacity-100">
                            <source src="/home/leaves.mp4" type="video/mp4" />
                        </video>

                        <div className={`${styles.gradient} absolute inset-0 z-10`} />

                        <div className={`relative md:absolute h-full top-0 gap-5 py-6 px-10 flex flex-col items-center justify-center text-[#F5DEB3] z-20 ${introductionFont.className}`}>
                            <h2 className="text-2xl sm:text-5xl tracking-widest">THE FOX TEMPLE</h2>
                            <div className={`flex flex-col justify-center items-center md:my-auto xl:justify-between xl:items-center xl:flex-row text-base md:text-3xl text-balance`}>
                                <div className="text-center xl:text-left xl:w-1/4">
                                    <p>Fox Tale immerses you in the world of foxes and their exploits. You will assume the role of a lone little fox living in a fantastical setting.
                                        Your main objectives are to travel the world in search of food, to stay safe, and to learn more about your ancestors.</p>
                                </div>

                                <div className="text-center xl:text-right xl:w-1/4">
                                    <p>Numerous different animals can be encountered in the game. Each animal has distinctive qualities all its own. They can either facilitate or impede your adventures.
                                        There are also quests and puzzles in the world, to overcome which you must have the necessary skills and knowledge about the world around you.</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="relative flex flex-col-reverse items-center md:flex-row justify-between p-10 gap-5 bg-black">
                        <div className="relative top-[-100px] sm:top-[0] w-full uppercase text-center flex flex-col gap-4 text-[#F5DEB3]">
                            <h2 className="text-4xl">UNIVERSE</h2>
                            <p className="text-lg">FOX TALE immerses you in a world brimming with enigmatic locations and intriguing characters, each hiding secrets waiting to be uncovered. From shadow-drenched forests whispering ancient tales to elusive figures cloaked in mystery, every corner of this universe pulses with untold stories. Crave to unravel the cryptic past of these haunting landscapes and their inhabitants? Follow the link below to delve deeper into their secrets.</p>
                            <div className="flex justify-end">
                                <Link href="/universe" className="w-auto flex flex-row items-center justify-end gap-2 uppercase text-xl py-2 px-4 mr-4 mt-4 mb-4 text-white text-center rounded hover:bg-[#C2724F] transition duration-150 ease-in-out">
                                    UNIVERSE •
                                    <Image src="/home/Arrow.svg" alt="arrow" width={25} height={25} className="mt-1" />
                                </Link>
                            </div>
                        </div>

                        <div className="relative top-[-80px] sm:top-0 md:transform scale-50 smx:scale-[65%] sm:scale-100">
                            <svg width="538" height="583">
                                <defs>
                                    <pattern id="ImgAnimation" width='1' height='1'>
                                        <image
                                            href="/home/runningFox.jpg"
                                            width="600"
                                            height="585"
                                            preserveAspectRatio="xMidYMid slice"
                                        >
                                            <animateTransform
                                                attributeName="transform"
                                                type="translate"
                                                values="0; -62 0; 0 0"
                                                dur="8s"
                                                repeatCount="indefinite"
                                                keyTimes="0; 0.5; 1"
                                                keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
                                                calcMode="spline"
                                            />
                                        </image>
                                    </pattern>
                                </defs>
                                <path
                                    d="M80.3072 1.2888L160.114 82.0156V430.033L0.5 274.064L0.500018 82.016L80.3072 1.2888ZM457.693 1.28885L537.5 82.016L537.5 274.064L377.886 430.033V82.0156L457.693 1.28885ZM348.805 105.418L348.805 454.806L269.34 533.041L189.532 454.806L189.532 105.422L269.339 184.514L348.805 105.418ZM0.720283 299.067L160.334 454.537V481.683L0.720283 326.213V299.067ZM537.043 299.067V326.213L377.429 481.683V454.537L537.043 299.067ZM189.074 479.313L268.882 557.049L349.184 479.318V506.46L268.88 583.695L189.074 506.459V479.313Z"
                                    stroke="transparent"
                                    fill="url(#ImgAnimation)"
                                    className="object-fill"
                                />
                            </svg>
                        </div>
                    </div>
                    <Footer />
                </motion.div>
            )
            }
        </div>
    );
}