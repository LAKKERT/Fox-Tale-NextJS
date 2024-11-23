'use client';
import { K2D } from "next/font/google";
import { motion } from 'framer-motion';
import { useState } from "react";

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
        <div className={`w-full h-[90vh] px-2 mt-[100px] bg-[url('/login/gradient_bg.png')] object-cover bg-cover bg-center bg-no-repeat overflow-hidden text-white ${MainFont.className}`}>
            <div className="flex flex-col gap-2 pt-2">
                <h2 className="text-xl text-balance text-center">Before contacting support, please read the frequently asked questions. You might find the answer there.</h2>
                
                <div className="max-w-[1110px] flex flex-col gap-2">
                    {cards.map((card) => (
                        <div key={card.id} className={`flex flex-col gap-1 bg-[rgba(6,6,6,.65)] rounded p-2 `}>
                            <button onClick={() => toggleCard(card.id)}>
                                <div className="text-lg flex flex-row justify-between">
                                    <p>{card.title}</p>
                                        {openCards[card.id] ? '▲' : '▼' }
                                </div>
                            </button>
                            <motion.div
                                initial = {{ height: '0px' }}
                                animate = {{ height: openCards[card.id] ? 'auto' : '0px'}}
                                transition={{ duration: .3 }}
                                className="overflow-hidden"
                            >
                                {card.content}
                            </motion.div>
                        </div>
                    ))}
                </div>

            </div>

        </div>
    )
}