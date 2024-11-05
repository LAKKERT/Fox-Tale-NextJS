"use client";
import { Loader } from '@/app/components/load';
import { Header } from '@/app/components/header';
import { getChatRoom, addNewParticipant } from '@/pages/api/support/getRequestsAPI';
import { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { useRouter } from 'next/navigation';
import { io } from "socket.io-client";
import { motion } from 'framer-motion';

import { K2D } from "next/font/google";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "300",
});

export default function SupportChatRoom(params) {
    const [isLoading, setIsLoading] = useState(true);
    const [chatData, setChatData] = useState(null);
    const [usersData, setUsersData] = useState([]);
    const [cookies] = useCookies(['auth_token']);
    const router = useRouter();

    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState([]);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (!cookies.auth_token) {
            router.push('/');
            return;
        }

        const AddNewParticipant = async () => {
            try {
                await addNewParticipant(cookies, params.params.id);
            }catch (error) {
                console.error('Error adding new participant:', error);
            }
        }

        AddNewParticipant();

        const fetchChatRoom = async () => {
            try {
                const data = await getChatRoom(params.params.id)
                const response = await fetch(`/api/support/getMessagesAPI?roomID=${params.params.id}`);
                const result = await response.json();

                if (data && result) {
                    setIsLoading(false);
                    const timeout = setTimeout(() => {
                        setChatData(data.chatData);
                        setUsersData(data.usersData || []);
                        setMessages(result.messages || []);
                        return () => clearTimeout(timeout);
                    }, 300)
                }
            } catch (errors) {
                console.error('Error fetching chat room:', errors);
                router.push('/');
            };
        };

        fetchChatRoom();
    }, [params, cookies.auth_token]);

    useEffect(() => {
        const socketInstance = io("http://localhost:3000", {path: "/api/support/socket"})
        setSocket(socketInstance);

        socketInstance.on("message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socketInstance.disconnect();
        }
    }, [])

    const sendMessage = async () => {
        if (socket && message.trim()) {
            const messageData = {
                content: message,
                roomID: chatData.id,
                userID: cookies.auth_token,
            }
            socket.emit("message", messageData);
            setMessages((prevMessages) => [...prevMessages, messageData]);
            setMessage("");
        }
    }

    return (
        <div className={`w-full h-[90vh] bg-[url('/login/gradient_bg.png')] object-cover bg-cover bg-center bg-no-repeat ${MainFont.className} text-white`}>
            <Header />
            <div className='h-full mt-[100px] flex flex-col justify-center items-center'>
                {!messages || !usersData || !chatData ? (
                    <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: isLoading ? 1 : 0 }}
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
                        className='flex flex-col gap-4 sm:px-4'
                    >
                        <div className='w-[290px] h-[600px] sm:w-auto sm:max-w-[750px] bg-[rgba(6,6,6,.65)] flex flex-col items-center rounded-xl px-3 sm:px-8 py-5 overflow-scroll'>
                            <div className='text-base sm:text-xl font-extralight tracking-[5px] text-balance'>
                                <h3>{chatData?.title}</h3>
                            </div>
                            
                            <div className='w-full text-left'>
                                <p>{chatData?.description}</p>
                            </div>

                            <div>
                                {usersData.map((user) => (
                                    <div key={user.username}>
                                        {user.username}
                                    </div>
                                ))}
                            </div>
            
                            <div className='w-full text-left text-base sm:text-lg flex flex-col gap-3 font-extralight tracking-[1px] text-balance'>
                                {messages.map((message) => (
                                    <p>{message.message}</p>
                                ))}
                                {messages.map((msg, index) => (
                                    <div key={index}>
                                        <p>{msg.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className='flex flex-row bg-[rgba(6,6,6,.65)] p-2 rounded-xl'>
                            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder='WRITE A MESSAGE...' className='w-full bg-transparent outline-none font-extralight tracking-[1px] text-balance' />
                            <button onClick={sendMessage}>send</button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}