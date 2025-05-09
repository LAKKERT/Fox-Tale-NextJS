"use client";
import { Loader } from '@/app/components/load';
import { Header } from '@/app/components/header';
import { ChatBoard } from '@/app/components/support/chatBoard';
import { ChatInputField } from '@/app/components/support/chatInputField';
import { AdminPanel } from '@/app/components/support/adminPanel';
import { useEffect, useState} from 'react';
import { useUserStore } from '@/stores/userStore';
import { useCookies } from 'react-cookie';
import { useRouter } from 'next/navigation';
import { io } from "socket.io-client";
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { UsersData, Message, ChatData } from "@/lib/types/supportChat";

import { K2D } from "next/font/google";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: ["300", "600", "800"],
});

export default function SupportChatRoom() {
    const params = useParams();
    const [chatData, setChatData] = useState<ChatData>({
        id: '',
        title: '',
        created_at: '',
        description: '',
        status: false,
        files: [],
    });
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [usersData, setUsersData] = useState<UsersData[]>([]);
    const userData = useUserStore((state) => state.userData);
    const [cookies] = useCookies(['auth_token']);

    const router = useRouter();

    const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);

    useEffect(() => {
        if (!socket) {
            const socketInstance = io("http://localhost:3000", { path: "/api/support/socket" })
            setSocket(socketInstance);

            socketInstance.on("message", (msg) => {
                setMessages((prev) => [...prev, msg]);
            });

            socketInstance.on("participants", (participant) => {
                setUsersData([...participant.participants]);
            });

            socketInstance.on('closeChat', (chatData) => {
                setChatData({...chatData})
            });

            return () => {
                socketInstance.disconnect();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            if (!cookies.auth_token) {
                return router.push('/');

            }

            try {

                const payload = {
                    roomID: params?.id,
                }

                const response = await fetch(`/api/support/getChatRoomAPI`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${cookies.auth_token}`
                    },
                    body: JSON.stringify(payload)
                })

                const result = await response.json();

                if (!isMounted) return;

                if (response.ok) {
                    setIsLoading(false);
                    setChatData(result.chatData)
                    setUsersData(result.usersData);
                    setMessages(result.messages);

                    if (socket) {
                        const participantsList = {
                            participants: result.usersData
                        }
    
                        socket.emit('participants', participantsList)
                    }

                } else {
                    console.error('Error fetching chat room data');
                    return router.push('/');
                }


            } catch (error) {
                console.error('Error fetching data:', error);
                return router.push('/');
            }
        }

        fetchData();

        return () => {
            isMounted = false;
        }

    }, [cookies, params?.id, router, socket]);

    return (
        <div className={`w-full ${MainFont.className} text-white caret-transparent`}>
            <Header />
            {isLoading ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
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
                    className={`min-h-[calc(100vh-100px)] mt-[100px] flex flex-col justify-center items-center bg-[url('/login/gradient_bg.png')] object-cover bg-cover bg-center bg-no-repeat`}
                >
                    <div className='w-full flex flex-row justify-center sm:min-w-[500px] md:min-w-[750px]'>
                        {userData?.role === 'admin' ? (
                            <AdminPanel chatData={chatData} usersData={usersData} cookies={cookies} socket={socket} />
                        ) : (
                            null
                        )}
                        <div className='flex flex-col gap-3'>
                            <ChatBoard userData={userData} usersData={usersData} chatData={chatData} messages={messages} isLoading={isLoading} />

                            <ChatInputField chatData={chatData} socket={socket} userID={userData?.id}  />
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    )
}