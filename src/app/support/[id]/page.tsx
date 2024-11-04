"use client";

import { getChatRoom, addNewParticipant } from '@/pages/api/support/getRequestsAPI';
import { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { useRouter } from 'next/navigation';

export default function SupportChatRoom(params) {
    const [chatData, setChatData] = useState(null);
    const [usersData, setUsersData] = useState([]);
    const [cookies] = useCookies(['auth_token']);
    const router = useRouter();

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
                console.log(data);
                setChatData(data.chatData);
                setUsersData(data.usersData || []);
            } catch (errors) {
                console.error('Error fetching chat room:', errors);
                router.push('/');
            }
        }

        fetchChatRoom();
    }, [params]);

    return (
        <div>
            <h1>Support Chat Room</h1>
            <p>This is a support chat room where users can ask questions or discuss issues.</p>
            <h3>{chatData?.title}</h3>
            <p>{chatData?.description}</p>

            <div>
                {usersData.map((user) => (
                    <div key={user.username}>
                        {user.username}
                    </div>
                ))}
            </div>
        </div>
    )
}