"use client";
import { Loader } from '@/app/components/load';
import { Header } from '@/app/components/header';
import { getChatRoom, addNewParticipant } from '@/pages/api/support/getRequestsAPI';
import { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { useRouter } from 'next/navigation';
import { io } from "socket.io-client";
import { motion } from 'framer-motion';
import Image from "next/image";

import { K2D } from "next/font/google";
import { div } from 'framer-motion/client';

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
    const [message, setMessage] = useState('');
    const [file, setFile] = useState(null);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (!cookies.auth_token) {
            router.push('/');
            return;
        }

        const AddNewParticipant = async () => {
            try {
                await addNewParticipant(cookies, params.params.id);
            } catch (error) {
                console.error('Error adding new participant:', error);
            }
        }

        AddNewParticipant();

        const fetchChatRoom = async () => {
            try {
                const data = await getChatRoom(params.params.id)
                const response = await fetch(`/api/support/getMessagesAPI?roomID=${params.params.id}`);
                const result = await response.json();
                console.log(result);

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
        const socketInstance = io("http://localhost:3000", { path: "/api/support/socket" })
        setSocket(socketInstance);

        socketInstance.on("message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socketInstance.disconnect();
        }
    }, [])

    function getFile(file) {
        let fileProperty = [];
        for (let i = 0; i < file.length; i++) {
            const parts = file[i].name.split('.');

            fileProperty[i] = {
                name: parts[0],
                extenstion: parts[1] || '',
                size: file[i].size,
            };
        }

        return fileProperty;
    }

    const sendMessage = async () => {
        // try {
        //     // Используем Promise.all для асинхронного чтения всех файлов
        //     const filesData = await Promise.all(
        //         Array.from(file).map((singleFile) =>
        //             new Promise((resolve, reject) => {
        //                 const reader = new FileReader();
        //                 reader.onloadend = () => resolve(reader.result);
        //                 reader.onerror = reject;
        //                 reader.readAsDataURL(singleFile);
        //             })
        //         )
        //     );

        //     // Вызываем отправку сообщений после завершения чтения всех файлов
        //     sendMessageWithFile(filesData);
        // } catch (error) {
        //     console.error("Ошибка чтения файлов:", error);
        // }
        
        let filesData = [];

        if (file) {
            for (let i = 0; i < file.length; i++) {
                // if (file[i]) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const fileData = reader.result; // результат чтения файла в base64
                        filesData.push(fileData);
                        console.log(filesData.length, fileData);
                        if (filesData.length === file.length) {
                            // вызываем только после завершения чтения всех файлов
                            sendMessageWithFile(filesData);
                        } else {
                            console.log('Не все файлы загружены');
                        }
                    };
                    reader.readAsDataURL(file[i]); // читаем файл как base64
                // }
            }
        }else {
            sendMessageWithFile();
        }
    };

    const sendMessageWithFile = async (fileData = null) => {
        let fullFileName;
        if (file) {
            fullFileName = getFile(file);
        }
        console.table("fullname",fullFileName);

        if (socket) {
            const messageData = {
                content: message,
                file: fileData,
                fileProperties: fullFileName,
                roomID: chatData.id,
                userID: cookies.auth_token,
            }
            console.table(messageData);
            socket.emit("message", messageData);
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
                                {messages.map((msg, index) => (
                                    <div key={index}>
                                        <p>{msg.message}</p>
                                        <p>{msg.content}</p>
                                        {/* Проверяем, если `file_url` массив, выводим каждое изображение */}
                                        {Array.isArray(msg.file_url) && msg.file_url.map((url, i) => (
                                            <Image
                                                key={i}
                                                src={`http://localhost:3000${url}`} // Преобразуем относительный путь в абсолютный
                                                alt={`Отправленное изображение ${i + 1}`}
                                                width={100}  // Укажите нужный размер
                                                height={100} // Укажите нужный размер
                                            />
                                        ))}

                                        {/* {msg.file_url && (
                                            <Image
                                                src={msg.file_url.startsWith("http") ? msg.file_url : `http://localhost:3000${msg.file_url}`}
                                                alt="Отправленное изображение"
                                                width={100}
                                                height={100}
                                            />
                                        )} */}
                                        <p>{msg.sent_at}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className='flex flex-row bg-[rgba(6,6,6,.65)] p-2 rounded-xl'>
                            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder='WRITE A MESSAGE...' className='w-full bg-transparent outline-none font-extralight tracking-[1px] text-balance' />
                            {/* <input type="file" onChange={(e) => setFile(e.target.files[0])} /> */}
                            <input type="file" onChange={(e) => setFile(e.target.files)} multiple />
                            <button onClick={sendMessage}>send</button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}