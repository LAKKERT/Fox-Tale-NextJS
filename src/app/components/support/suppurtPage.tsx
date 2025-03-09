'use client';
import { K2D } from "next/font/google";
import { motion } from 'framer-motion';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCookies } from "react-cookie";
import Link from "next/link";
import { Loader } from "@/app/components/load";
const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

type OpenCardsState = {
    [key: number]: boolean;
  };

export function SupportPageComponent() {
    const [isLoading, setIsLoading] = useState(true);
    const [openCards, setOpenCards] = useState<OpenCardsState>({});
    const [currentUserRole, setCurrentUserRole] = useState('');
    const [cookies] = useCookies(['auth_token']);
    const router = useRouter();

        useEffect(() => {
            const checkUserRole = async () => {
                try {
                    const response = await fetch('/api/fetchUserRoleAPI', {
                        headers: {
                            'Authorization': `Bearer ${cookies.auth_token}`,
                        }
                    })
    
                    const result = await response.json();
    
                    if (result.userRole !== 'admin') {
                        setCurrentUserRole(result.userRole);
                    }
                } catch (error) {
                    console.error('Error fetching user role:', error);
                }
            }
        
            checkUserRole()
        }, [cookies, router] )

    setTimeout(() => {
        setIsLoading(false);
    }, 300)

    const toggleCard = (id: number) => {
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
        <div>
        {isLoading ? (
            <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: isLoading ? 0 : 1 }}
                transition={{ duration: .3 }}
                className="bg-black w-full h-[100vh]"
            >
                <Loader />
            </motion.div>
        ) : (
            
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoading ? 0 : 1 }}
                transition={{ duration: .3 }}
                className={`w-full flex  justify-center px-2 mt-[100px] object-cover bg-cover bg-center bg-no-repeat text-white ${MainFont.className}`}
            >

                <div className="flex flex-col items-center gap-5 pt-2 my-auto">
                    <h2 className="text-lg md:text-2xl text-balance text-center">Before contacting support, please read the frequently asked questions.<br /> You might find the answer there.</h2>

                    <div className="max-w-[1110px] flex flex-col gap-5">
                        {cards.map((card) => (
                            <button key={card.id} onClick={() => toggleCard(card.id)}>
                                <div className={`flex flex-col bg-[rgba(6,6,6,.65)] rounded p-2 `}>
                                    <div className="text-lg md:text-lg flex flex-row justify-between">
                                        <p className="text-lg md:text-xl">{card.title}</p>

                                        <div className={`select-none transform duration-300 ${openCards[card.id] ? 'rotate-180' : 'rotate-360'}`}>
                                            <p>▼</p>
                                        </div>
                                    </div>
                                    <motion.div
                                        initial={{ height: '0px' }}
                                        animate={{ height: openCards[card.id] ? 'auto' : '0px' }}
                                        transition={{ duration: .3 }}
                                        className="overflow-hidden text-md md:text-lg select-text text-left"
                                    >
                                        {card.content}
                                    </motion.div>

                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col items-center gap-5">
                        <p className="text-lg md:text-2xl text-balance text-center">If you haven&apos;t found the answer to your problem, please contact our support team.</p>
                        <Link href='/support/create_support_chat' className="flex justify-center items-center w-[250px] h-[50px] text-lg tracking-wider transition-colors duration-75 rounded border border-[#F5DEB3] bg-[#C2724F] hover:bg-[#b66847] uppercase select-none">WRITE</Link>
                    </div>

                    <div className="flex flex-col items-center gap-5">
                        <p className="text-lg md:text-2xl text-balance text-center">If you want to view the history of your requests, please follow the link.</p>
                        <Link href='/support/requests_history' className="flex justify-center items-center w-[250px] h-[50px] text-lg tracking-wider transition-colors duration-75 rounded border border-[#F5DEB3] bg-[#C2724F] hover:bg-[#b66847] uppercase select-none">HISTORY</Link>
                    </div>

                    <div className={`flex flex-col items-center gap-5 ${currentUserRole === 'admin' ? '' : 'hidden'}`}>
                        <p className={`text-lg md:text-2xl text-balance text-center`}>All requests</p>
                        <Link href='/support/requests_list' className="flex justify-center items-center w-[250px] h-[50px] text-lg tracking-wider transition-colors duration-75 rounded border border-[#F5DEB3] bg-[#C2724F] hover:bg-[#b66847] uppercase select-none">ALL REQUESTS</Link>
                    </div>

                </div>

            </motion.div>
        )}
        </div>
    )
}