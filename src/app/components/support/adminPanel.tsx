'use client';

import { useState } from "react";
import styles from "@/app/styles/home/variables.module.scss";
import { motion } from 'framer-motion';
import { ChatData, UsersData } from "@/lib/types/supportChat";
import { supabase } from "@/lib/supabase/supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";

interface Props {
    usersData: UsersData[];
    chatData: ChatData;
    cookies: {
        roleToken?: string
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket: any
    chat: RealtimeChannel
}

export function AdminPanel({ usersData, chatData, cookies, socket, chat }: Props) {
    const [confirmClose, setConfirmClose] = useState(false);

    const closeChatRoom = async () => {
        try {
            if (process.env.NEXT_PUBLIC_ENV === 'production') {
                const chatIsClose = {
                    ...chatData,
                    status: true
                }
                const { error } = await supabase
                    .from('chat_room')
                    .update({
                        status: true
                    })
                    .eq('id', chatData.id);
                if (error) {
                    console.error(error);
                } else {
                    if (chat) {
                        chat.send({
                            type: 'broadcast',
                            event: 'closeChat',
                            payload: chatIsClose
                        })
                    }
                }
            } else {
                await fetch(`/api/support/closeChatAPI`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        roomID: chatData.id,
                        cookies: cookies.roleToken,
                    }),
                });

                if (socket) {
                    socket.emit('closeChat', chatData);
                }
            }
        } catch (error) {
            console.error('Error close chat:', error);
        }
    };

    return (
        <div className='flex flex-col justify-between bg-[rgba(6,6,6,.65)] rounded-xl px-3 py-3 h-1/2 w-[250px]'>
            <div className={`h-full pb-4 overflow-auto overflow-x-hidden ${styles.custom_chat_scroll}`}>
                <p className='uppercase text-center'>participants</p>
                {usersData.map((user, index) => (
                    <div key={index} className='text-center'>
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