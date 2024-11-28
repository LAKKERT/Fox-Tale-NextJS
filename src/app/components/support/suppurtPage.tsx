'use client';
import { K2D } from "next/font/google";
import { motion } from 'framer-motion';
import { useState } from "react";
import Link from "next/link";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

export function SupportPageComponent() {

    const [openCards, setOpenCards] = useState({});

    const toggleCard = (id) => {
        setOpenCards((prev) => ({ 
            ...prev,
            [id]: !prev[id],
        }))
    }

    const cards = [
        {
            id: 1,
            title: 'How do I install the game?',
            content:
                'To install the game, download the installer from our website and follow the installation wizard instructions. Make sure you have enough space on your hard drive and that your graphics card drivers are up to date.',
        },
        {
            id: 2,
            title: 'How do I update the game?',
            content:
                'To update the game, open the launcher and click on "Check for updates." If an update is available, it will automatically download and install.',
        },
        {
            id: 3,
            title: 'How do I reset my password?',
            content:
                'Go to the login page and click on "Forgot Password." Follow the instructions to reset your password via email.',
        },
    ];
 
    return (
        <div className={`w-full h-[89vh] px-2 mt-[100px] bg-[url('/login/gradient_bg.png')] object-cover bg-cover bg-center bg-no-repeat text-white ${MainFont.className}`}>
            <div className="flex flex-col items-center gap-5 pt-2">
                <h2 className="text-lg md:text-2xl text-balance text-center">Before contacting support, please read the frequently asked questions.<br/> You might find the answer there.</h2>
                
                <div className="max-w-[1110px] flex flex-col gap-5">
                    {cards.map((card) => (
                        <div key={card.id} className={`flex flex-col gap-5 bg-[rgba(6,6,6,.65)] rounded p-2 `}>
                            <button onClick={() => toggleCard(card.id)}>
                                <div className="text-lg md:text-lg flex flex-row justify-between">
                                    <p className="text-lg md:text-2xl">{card.title}</p>
                                        <div className="select-none">
                                            {openCards[card.id] ? '▲' : '▼' }
                                        </div>
                                </div>
                            </button>
                            <motion.div
                                initial = {{ height: '0px' }}
                                animate = {{ height: openCards[card.id] ? 'auto' : '0px'}}
                                transition={{ duration: .3 }}
                                className="overflow-hidden text-lg md:text-3xl select-text"
                            >
                                {card.content}
                            </motion.div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-5">
                    <p className="text-lg md:text-2xl text-balance text-center">If you haven't found the answer to your problem, please contact our support team.</p>
                    <Link href='/support/create_support_chat' className="flex justify-center items-center w-[250px] h-[50px] text-lg tracking-wider transition-colors duration-75 rounded border border-[#F5DEB3] bg-[#C2724F] hover:bg-[#c2724f91] uppercase select-none">WRITE</Link>
                </div>

                <div className="flex flex-col items-center gap-5">
                    <p className="text-lg md:text-2xl text-balance text-center">If you want to view the history of your requests, please follow the link.</p>
                    <Link href='/' className="flex justify-center items-center w-[250px] h-[50px] text-lg tracking-wider transition-colors duration-75 rounded border border-[#F5DEB3] bg-[#C2724F] hover:bg-[#c2724f91] uppercase select-none">HISTORY</Link>
                </div>

            </div>

        </div>
    )
}