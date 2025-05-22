"use client";
import { Loader } from '@/app/components/load';
import { Header } from '@/app/components/header';
import { ChatBoard } from '@/app/components/support/chatBoard';
import { ChatInputField } from '@/app/components/support/chatInputField';
import { AdminPanel } from '@/app/components/support/adminPanel';
import { useEffect, useState } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useCookies } from 'react-cookie';
import { useRouter } from 'next/navigation';
import { io } from "socket.io-client";
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { UsersData, Message, ChatData } from "@/lib/types/supportChat";

import { K2D } from "next/font/google";
import { supabase } from '@/lib/supabase/supabaseClient';

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
    const [isLoading, setIsLoading] = useState(false);
    const [usersData, setUsersData] = useState<UsersData[]>([]);
    const userData = useUserStore((state) => state.userData);
    const [cookies] = useCookies(['roleToken']);
    const [userRole, setUserRole] = useState<string>();

    const router = useRouter();

    const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);


    const handleRole = (role: string) => {
        setUserRole(role)
    }

    const chatChannel = supabase.channel('support-channel');
    
    useEffect(() => {
        chatChannel
            .on(
                'broadcast',
                { event: 'sendMessage' },
                (payload) => {
                    setMessages(prev => [...prev, payload.payload.message]);
                }
            )
            .subscribe();

        chatChannel.on(
            'broadcast',
            { event: 'addParticipant' },
            (payload) => {
                setUsersData(payload.payload.participants);
            }
        )

        chatChannel.on(
            'broadcast',
            { event: 'closeChat' },
            (payload) => {
                setChatData({...payload.payload})
            }
        )

        return () => {
            chatChannel.unsubscribe();
        }
    }, [])

    useEffect(() => {
        if (!socket) {
            if (process.env.NEXT_PUBLIC_ENV === 'production') {
                const socketInstance = io("/", { path: "/api/support/socket" })
                setSocket(socketInstance);

                socketInstance.on("message", (msg) => {
                    setMessages((prev) => [...prev, msg]);
                });

                socketInstance.on("participants", (participant) => {
                    setUsersData([...participant.participants]);
                });

                socketInstance.on('closeChat', (chatData) => {
                    setChatData({ ...chatData })
                });

                return () => {
                    socketInstance.disconnect();
                }
            } else {
                const socketInstance = io("http://localhost:3000", { path: "/api/support/socket" })
                setSocket(socketInstance);

                socketInstance.on("message", (msg) => {
                    setMessages((prev) => [...prev, msg]);
                });

                socketInstance.on("participants", (participant) => {
                    setUsersData([...participant.participants]);
                });

                socketInstance.on('closeChat', (chatData) => {
                    setChatData({ ...chatData })
                });

                return () => {
                    socketInstance.disconnect();
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            if (!cookies.roleToken) {
                return router.push('/');
            }
            if (userData) {

                try {
                    if (process.env.NEXT_PUBLIC_ENV === 'production') {
                        const { data, error } = await supabase
                            .from('chat_room')
                            .select(`
                                id,
                                title,
                                created_at,
                                description,
                                status,
                                files,
                                messages ( 
                                    room_id,
                                    user_id,
                                    message:message,
                                    sent_at,
                                    file_url
                                )
                            `)
                            .eq('id', params?.id)
                            .single();
                        if (error) {
                            console.error(error);
                            return;
                        }

                        const { data: participantData } = await supabase
                            .from('participants')
                            .select('*')
                            .eq('user_id', userData?.id)
                            .eq('room_id', params?.id)
                            .single();

                        if (participantData === null) {
                            const { error } = await supabase
                                .from('participants')
                                .insert({
                                    user_id: userData?.id,
                                    room_id: params?.id,
                                    username: userData.username
                                });

                            if (error) console.error(error);
                        }

                        if (data) {

                            const { data: participantsData, error: participantsError } = await supabase
                                .from('participants')
                                .select('user_id, username')
                                .eq('room_id', params?.id);

                            if (participantsError) {
                                console.error(participantsError);
                                return;
                            }

                            // const userIds = participantsData.map((participant: { user_id: string, username: string }) => participant.user_id);

                            // const { data: usersData, error: usersError } = await supabase
                            //     .from('user_metadata')
                            //     .select('id: userID, username, role')
                            //     .in('userID', userIds);

                            // if (usersError) {
                            //     console.error(usersError);
                            //     return;
                            // }

                            // const participants = usersData;
                            setUsersData(participantsData);

                            const formattedData = {
                                ...data,
                                messages: data.messages.map(msg => ({
                                    ...msg,
                                    content: "",
                                    unreaded: false,
                                }))
                            };
                            setChatData({
                                id: formattedData.id,
                                title: formattedData.title,
                                created_at: formattedData.created_at,
                                description: formattedData.description,
                                status: formattedData.status,
                                files: formattedData.files,
                            });
                            setMessages(formattedData.messages)
                            setIsLoading(false);

                            if (error) {
                                console.error(error);
                            } else {
                                if (chatChannel) {
                                    chatChannel.send({
                                        type: 'broadcast',
                                        event: 'addParticipant',
                                        payload: {
                                            participants: participantsData
                                        }
                                    })
                                    // const participantsList = {
                                    //     participants: participantsData
                                    // }

                                    // socket.emit('participants', participantsList)
                                }
                            }
                        }
                    } else {
                        const payload = {
                            roomID: params?.id,
                        }

                        const response = await fetch(`/api/support/getChatRoomAPI`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${cookies.roleToken}`
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
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                    return router.push('/');
                }
            }
        }

        fetchData();

        return () => {
            isMounted = false;
        }

    }, [cookies, params?.id, router, socket, userData]);

    return (
        <div className={`w-full ${MainFont.className} text-white caret-transparent`}>
            <Header role={handleRole} />
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
                        {userRole === 'admin' ? (
                            <AdminPanel chatData={chatData} usersData={usersData} cookies={cookies} socket={socket} chat={chatChannel} />
                        ) : (
                            null
                        )}
                        <div className='flex flex-col gap-3'>
                            <ChatBoard userData={userData} usersData={usersData} chatData={chatData} messages={messages} isLoading={isLoading} />

                            <ChatInputField chatData={chatData} socket={socket} userID={userData?.id} chat={chatChannel} />
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    )
}