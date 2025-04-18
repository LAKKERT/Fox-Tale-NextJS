'use client';

import { useEffect, useState } from "react";
import styles from "@/app/styles/home/variables.module.scss";
import { motion } from 'framer-motion';
import { DefaultEventsMap, Socket } from "socket.io";

interface Props {
    usersData: UsersData[];
    chatData?: ChatData;
    cookies: {
        auth_token?: any
    };
    socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap> | null;
}

export function AdminPanel({ usersData, chatData, cookies, socket }: Props) {
    const [confirmClose, setConfirmClose] = useState(false);

    const closeChatRoom = async () => {
        try {
            await fetch(`/api/support/closeChatAPI`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomID: chatData.id,
                    cookies: cookies.auth_token,
                }),
            });
    
            if (socket) {
                socket.emit('closeChat', chatData);
                console.log('closeChat', chatData)
            }
        }catch (error) {
            console.error('Error close chat:', error);
        }
    };

    useEffect(() => {
        console.log('closeChat', chatData)
    }, [socket, chatData])

    return (
        <div className='flex flex-col justify-between bg-[rgba(6,6,6,.65)] rounded-xl px-3 py-3 h-1/2 w-[250px]'>
            <div className={`h-full pb-4 overflow-auto overflow-x-hidden ${styles.custom_chat_scroll}`}>
                <p className='uppercase text-center'>participants</p>
                {usersData.map((user) => (
                    <div key={user.username} className='text-center'>
                        {user.username}
                    </div>
                ))}
            </div>
            {chatData.status === true ? (
                null
            ) : (
                <button onClick={() => setConfirmClose(prev => !prev)} className="w-full h-11 bg-[#C67E5F] hover:bg-[rgba(198,126,95,.80)] rounded text-white text-center cursor-pointer transition-all duration-150 ease-in-out">Problem is solved</button>
            )}

            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: confirmClose ? 1 : 0, height: confirmClose ? 38 : 0 }}
                className={`flex flex-row justify-evenly items-center text-lg ${chatData.status ? 'hidden' : 'block'}`}
            >
                <button onClick={closeChatRoom}>
                    Yes
                </button>

                <button onClick={() => setConfirmClose(prev => !prev)}>
                    No
                </button>
            </motion.div>
        </div>
    )
}