"use client";
import { Loader } from '@/app/components/load';
import { Header } from '@/app/components/header';
import { saveFile } from '@/pages/api/support/sendMessageAPI';
import { useEffect, useState, useRef, useCallback, useReducer } from 'react';
import { useCookies } from 'react-cookie';
import { useRouter } from 'next/navigation';
import { io, Socket } from "socket.io-client";
import { motion } from 'framer-motion';
import Image from "next/image";
import styles from "@/app/styles/home/variables.module.scss";

import { K2D } from "next/font/google";

const MAX_FILES_ALLOWED = 5;

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "300",
});

type UsersData = {
    id: string,
    username: string,
    role: string,
}

type ChatData = {
    id: string,
    title: string,
    created_at: string,
    description: string
    status: boolean,
};

type User = {
    userID: string;
    userRole: string;
};

type Message = {
    message: string;
    content: string;
    user_id: string;
    file_url: string[];
    sent_at: string;
    unreaded: boolean;
};

const initialState = {
    isAtBottom: false,
    newMessage: false,
    lastSeenMessage: null,
}

const reducer = (state, action) => {
    switch (action.type) {
        case 'SCROLL_TO_BOTTOM':
            return { ...state, isAtBottom: action.payload, newMessage: false };
        case 'SET_NEW_MESSAGE':
            return { ...state, newMessage: true };
        case 'SET_LAST_SEEN_MESSAGE':
            return { ...state, lastSeenMessage: action.payload };
        default:
            return state;
    }
}

export default function SupportChatRoom(params: { params: { id: number; }; }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isChatClose, setIsChatClose] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [showImage, setShowImage] = useState<string | null>(null);
    const [chatData, setChatData] = useState<ChatData>({} as ChatData);
    const [usersData, setUsersData] = useState<UsersData[]>([]);
    const [currentUser, setCurrentUser] = useState<User>({} as User);
    const [cookies] = useCookies(['auth_token']);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const messageRefs = useRef([]);
    const observer = useRef<IntersectionObserver | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const [state, dispatch] = useReducer(reducer, initialState);

    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState('');

    const [timing, setTiming] = useState(false);

    const scrollToBottom = useCallback(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        const handleUnloadOrPopState = async (event) => {
            if (state.lastSeenMessage !== null) {
                const payload = {
                    userID: currentUser.userID,
                    roomID: chatData.id,
                    lastSeenMessage: state.lastSeenMessage,
                };
                console.log(state.lastSeenMessage)

                try {
                    const response = await fetch('/api/support/lastMessageAPI', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                    });

                    if (response.ok) {
                        console.log('Last message sent');
                    } else {
                        console.error('Error sending last message');
                    }
                } catch (errors) {
                    console.error('Error sending last message:', errors);
                }
            } else {
                console.error('lastSeenMessage is null, not sending the data');
            }
        };

        window.addEventListener('beforeunload', handleUnloadOrPopState);
        window.addEventListener('popstate', handleUnloadOrPopState);

        return () => {
            window.removeEventListener('beforeunload', handleUnloadOrPopState);
            window.removeEventListener('popstate', handleUnloadOrPopState);
        };
    }, [state.lastSeenMessage, currentUser.userID, chatData.id]);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            if (!cookies.auth_token) {
                router.push('/');
                return;
            }

            try {
                const currentUserPromise = fetch(`/api/support/fetchUserData?cookies=${cookies}`).then((res) => res.json());
                const addParticipantPromise = fetch(`/api/support/addNewParticipantAPI`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ cookies: cookies.auth_token, roomID: params.params.id})
                })
                const chatRoomDataPromise = fetch(`/api/support/getChatRoomAPI?roomID=${params.params.id}`).then((res) => res.json());
                const messagesPromise = fetch(`/api/support/getMessagesAPI?roomID=${params.params.id}`).then((res) => res.json());
            
                const [currentUserId, , chatData, result] = await Promise.all([
                    currentUserPromise,
                    addParticipantPromise,
                    chatRoomDataPromise,
                    messagesPromise,
                ])

                if (!isMounted) return;

                setCurrentUser(currentUserId);
                setIsLoading(false);

                if (chatData && result) {
                    setChatData(chatData.chatData);
                    setUsersData(chatData.usersData || []);
                    setMessages(result.messages || []);
                }


            } catch (error) {
                console.error('Error fetching data:', error);
                router.push('/');
            }
        }

        fetchData();

        return () => {
            isMounted = false;
        }

    }, [cookies, params.params.id, router, isChatClose]);

    useEffect(() => {
        const fetchLastSeenMessage = async () => {
            if (!currentUser.userID || !chatData.id) {
                console.error('User ID or Chat Data ID is undefined');
                return;
            }
    
            try {
                const lastSeenMessage = await fetch(`/api/support/lastMessageAPI?userID=${currentUser.userID}&roomID=${chatData.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
    
                const lastSeenMessageData = await lastSeenMessage.json();
    
                if (lastSeenMessage.ok && lastSeenMessageData.last_message_id !== undefined) {
                    messageRefs.current[lastSeenMessageData.last_message_id]?.scrollIntoView({ behavior: "smooth" });
                } else {
                    console.error('Error fetching last seen message:', lastSeenMessageData);
                }
            } catch (error) {
                console.error('Error fetching last seen message:', error);
            }
        };
    
        if (currentUser.userID && chatData.id) {
            fetchLastSeenMessage();
        }
    }, [usersData, chatData, currentUser.userID, chatData.id]);
    

    useEffect(() => {
        if (!socket) {
            const socketInstance = io("http://localhost:3000", { path: "/api/support/socket" })
            setSocket(socketInstance);
    
            socketInstance.on("message", (msg) => {
                setMessages((prev) => [...prev, msg]);
            });
    
            return () => {
                socketInstance.disconnect();
            }
        }
    }, [])

    function getFile(selectedFiles: string | any[] | FileList) {
        const fileProperty = [];
        for (let i = 0; i < selectedFiles.length; i++) {
            const fileName = selectedFiles[i].name;
            const lastDotIndex = fileName.lastIndexOf('.');
    
            const name = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
            const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex + 1) : '';
    
            fileProperty[i] = {
                name: name,
                extension: extension,
                size: selectedFiles[i].size,
            };
        }
    
        console.log(fileProperty);
    
        return fileProperty;
    }

    const readFileAsDataURL = (file: file): Promise<string | ArrayBuffer | null> => {
        return new Promise((resolve, rejects) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => rejects(new Error("Error reading file"));
            reader.readAsDataURL(file);
        });
    }

    const processFiles = async (files: FileList | null): Promise<string | ArrayBuffer | null> => {
        if (!files || files.length === 0) return [];
        const filePromises = Array.from(files).map((file) => readFileAsDataURL(file))
        return await Promise.all(filePromises);
    }

    const sendMessage = async () => {
        try {
            const filesData = await processFiles(selectedFiles);
            await sendMessageWithFile(filesData);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    const sendMessageWithFile = async (filesData: (string | ArrayBuffer | null)[] | null) => {
        if (!message && (!selectedFiles || selectedFiles.length === 0)) {
            return;
        }

        if (selectedFiles && selectedFiles?.length > MAX_FILES_ALLOWED) {
            return;
        }

        let fullFileName;
        const fileUrl = [];


        if (selectedFiles) {
            fullFileName = getFile(selectedFiles);
            for (let i = 0; i < selectedFiles.length; i++) {
                const fileName = `${Date.now()}_${fullFileName[i].name}.${fullFileName[i].extension}`;
                fileUrl.push(`/uploads/${fileName}`);
            }

            try {
                await saveFile(filesData, fileUrl)

            } catch (errors) {
                console.error('Error saving file:', errors);
            }
        }

        if (socket) {
            const messageData = {
                content: message,
                fileUrl: fileUrl,
                roomID: chatData?.id,
                user_id: currentUser.userID,
                status: chatData.status
            }
            socket.emit("message", messageData);
            setSelectedFiles(null);
            setMessage("");
        }
    }

    const handleImageClick = (url: string) => {
        setShowImage(showImage === url ? null : url);
    }

    const closeImage = () => {
        setTiming(true);
        const timeout = setTimeout(() => {
            setShowImage(null);
            setTiming(false);
        }, 300)
        return () => clearTimeout(timeout);
    }

    const handleInputChange = (e) => {
        const textarea = e.target;
        textarea.style.height = "auto";
        const maxHeight = 4 * parseFloat(getComputedStyle(textarea).lineHeight);

        if (textarea.scrollHeight > maxHeight) {
            textarea.style.height = `${maxHeight}px`;
            textarea.style.overflowY = "scroll";
        } else {
            textarea.style.height = `${textarea.scrollHeight}px`;
            textarea.style.overflowY = "hidden";
        }

        setMessage(e.target.value);
    }

    const handleFileChange = (e) => {
        const files = e.target.files
        if (files.length > 0) {
            setSelectedFiles([...files]);
        }
        e.target.value = '';
    }

    const handleDelete = (index) => {
        setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    }

    useEffect(() => {
        if (state.isAtBottom) {
            scrollToBottom();
        }
    }, [messages, state.isAtBottom]);

    const handleScrollAndMessages = useCallback(() => {
        const element = scrollContainerRef.current;
        if (element) {
            const isBottom = Math.ceil(element.scrollTop + element.clientHeight) >= element.scrollHeight;
            dispatch({ type: 'SCROLL_TO_BOTTOM', payload: isBottom });

            if (isBottom) {
                messages.forEach((msg, index) => {
                    msg.unreaded = false;
                    if (index > state.lastSeenMessage) {
                        dispatch({ type: 'SET_LAST_SEEN_MESSAGE', payload: index })
                    }
                });
            }
        }

        const timeout = setTimeout(() => {  
            const hasUnreadMessages = messages.some((msg) => msg.unreaded === true);
            if (hasUnreadMessages) {
                dispatch({ type: 'SET_NEW_MESSAGE' });
            }
        }, 100)

        return () => clearTimeout(timeout);

    }, [messages, state.lastSeenMessage]);

    useEffect(() => {
        handleScrollAndMessages();
    }, [messages, handleScrollAndMessages])

    useEffect(() => {
        const element = scrollContainerRef.current;

        if (element) {
            element.addEventListener('scroll', handleScrollAndMessages);

            return () => {
                if (element) {
                    element.removeEventListener('scroll', handleScrollAndMessages);
                }
            }
        }
    }, [handleScrollAndMessages])

    const scrollToUnreadMessage = useCallback(() => {

        const firstUnreadIndex = messages.findIndex((msg) => msg.unreaded === true);
        if (firstUnreadIndex !== -1 && messageRefs.current[firstUnreadIndex]) {
            messageRefs.current[firstUnreadIndex].scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    useEffect(() => {
        let messageIndex = 0;
        observer.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const messageId = parseInt(entry.target.getAttribute("data-id"), 10);
    
                    if (messageId > messageIndex) {
                        messageIndex = messageId;
                        dispatch({ type: 'SET_LAST_SEEN_MESSAGE', payload: messageIndex });
                    }
    
                    for (let i = 0; i <= messageId; i++) {
                        if (messages[i]?.unreaded === true) {
                            messages[i].unreaded = false;
                        }
                    }
                }
            });
        });

        const messageElements = document.querySelectorAll("[data-id]");
        messageElements.forEach((element) => {
            observer.current?.observe(element);
        })

        return () => {
            if (observer.current) {
                messageElements.forEach((element) => observer.current?.unobserve(element));
            }
        }
    }, [messages]);

    const handleKeyDown = (event) => {
        if (event.key === "Enter" && message.trim() !== '') {
            event.preventDefault();
            sendMessage();
            setMessage('');
        }
    }

    const closeChatRoom = async() => {
        await fetch(`/api/support/closeChatAPI`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                roomID: chatData.id,
                cookies: cookies.auth_token,
            }),
        })

        return setIsChatClose(true);
    };

    return (
        <div className={`w-full h-[90vh] bg-[url('/login/gradient_bg.png')] object-cover bg-cover bg-center bg-no-repeat ${MainFont.className} text-white `}>
            <Header />
            <div className='h-full mt-[100px] flex flex-col justify-center items-center'>

                {isLoading ? (
                    <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: .3 }}
                        className="bg-black w-full h-[100vh]"
                    >
                        <Loader />
                    </motion.div>
                ) : (

                    <div className='w-full flex flex-row justify-center sm:min-w-[500px] md:min-w-[750px]'>
                        {currentUser.userRole === 'admin' ? (
                            <div className='flex flex-col justify-between bg-[rgba(6,6,6,.65)] rounded-xl px-3 py-5 h-1/2 w-[250px]'>
                                <div className='h-full pb-4 overflow-auto overflow-x-hidden ${styles.custom_chat_scroll}'>
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
                                    <button onClick={closeChatRoom} className="w-full h-11 bg-[#C67E5F] hover:bg-[rgba(198,126,95,.80)] rounded text-white text-center cursor-pointer transition-all duration-150 ease-in-out">problem is solved</button>
                                )}
                            </div>
                        ) : (
                            null
                        )}

                        <div className='flex'>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isLoading ? 0 : 1 }}
                                transition={{ duration: .3 }}
                                className='relative w-full flex flex-col gap-4 px-4 mx-auto max-w-[750px]'
                            >
                                <button onClick={scrollToUnreadMessage} className={`absolute right-5 bottom-20 ${state.newMessage === true ? null : 'hidden'}`}>
                                    Unreaded messages
                                </button>
                                <div ref={scrollContainerRef} className={`w-full h-[600px] sm:w-auto sm:min-w-[400px] md:min-w-[650px] sm:max-w-[750px] bg-[rgba(6,6,6,.65)] flex flex-col gap-3 items-center rounded-xl px-3 sm:px-5 py-5 overflow-scroll overflow-x-hidden ${styles.custom_chat_scroll}`}>

                                    <div className='text-base sm:text-xl font-extralight tracking-[5px] text-balance'>
                                        <h3>{chatData?.title}</h3>
                                    </div>

                                    <div className='w-full text-base text-center '>
                                        <p>{chatData?.description}</p>
                                    </div>

                                    <div className='w-full text-base sm:text-lg flex flex-col gap-3 font-extralight tracking-[1px] text-balance'>
                                        {messages.map((msg, index) => {
                                            const isFirstMessageInSequence = index === 0 || messages[index - 1]?.user_id !== msg.user_id;
                                            return (
                                                <motion.div
                                                    key={index}
                                                    className={`flex flex-col w-full ${currentUser.userID === msg.userID || currentUser.userID === msg.user_id
                                                        ? 'items-end'
                                                        : 'items-start'
                                                        }`}
                                                    data-id={index}
                                                    ref={(el) => (messageRefs.current[index] = el)}
                                                >
                                                    {isFirstMessageInSequence && (
                                                        <p className='text-white tracking-widest'>
                                                            {usersData.find(user => user.id === msg.user_id || user.id === msg.userID)?.username || 'UNKNOWN'}
                                                        </p>
                                                    )}

                                                    {(msg?.content || msg?.message) ? (
                                                        <p ref={chatEndRef} className={`bg-[rgba(194,114,79,1)] rounded-lg py-2 px-3`}>
                                                            {msg?.content || msg?.message}
                                                        </p>
                                                    ) : (
                                                        null
                                                    )}

                                                    {Array.isArray(msg.file_url) &&
                                                        msg.file_url.map((url, i) => (
                                                            <motion.div key={`${index}-${i}`}
                                                                onClick={() => handleImageClick(`http://localhost:3000/${url}`)}
                                                                initial={{ width: '50%', height: 'auto' }}
                                                                transition={{ duration: .3 }}
                                                                className={`${i !== 0 || (msg.content || msg.message) ? 'mt-3' : ''} `}
                                                            >
                                                                <Image
                                                                    src={`http://localhost:3000/${url}`}
                                                                    alt={`Image ${i + 1}`}
                                                                    width={1080}
                                                                    height={1080}
                                                                    className={`rounded cursor-pointer`}
                                                                    loading='lazy'
                                                                />
                                                            </motion.div>
                                                        ))}
                                                    {showImage && (
                                                        <motion.div
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: timing ? 0 : 1 }}
                                                            transition={{ duration: 0.3 }}
                                                            onClick={closeImage}
                                                            className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.02)] bg-opacity-70 z-50 px-3"
                                                        >
                                                            <motion.div
                                                                initial={{ scale: 0.5 }}
                                                                animate={{ scale: timing ? 0 : 1 }}
                                                                transition={{ duration: 0.3 }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="relative"
                                                            >
                                                                <Image
                                                                    src={showImage}
                                                                    alt="Увеличенное изображение"
                                                                    width={600}
                                                                    height={600}
                                                                    className="rounded"
                                                                />
                                                                <button
                                                                    onClick={closeImage}
                                                                    className="absolute top-2 right-2 bg-[rgba(194,114,79,1)] text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-500 transition"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </motion.div>
                                                        </motion.div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                                {chatData.status === true ? (
                                    <div className='text-center text-white bg-[rgba(6,6,6,.65)] p-2 rounded-xl'>
                                        <p>problem has been solved</p>
                                    </div>
                                ) : (
                                    <div className={`flex flex-col ${ selectedFiles.length === 0 ? null : 'gap-2' } bg-[rgba(6,6,6,.65)] p-2 rounded-xl`}>
                                        <div className='flex flex-row gap-2 items-center select-none'>
                                            <textarea value={message} rows={1} onChange={handleInputChange} onKeyDown={handleKeyDown} autoFocus maxLength={1000} placeholder='WRITE A MESSAGE...' className={`w-full bg-transparent outline-none font-extralight tracking-[1px] text-balance resize-none ${styles.custom_scroll}`} />

                                            <label>
                                                <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept='image/*,video/*' className='hidden' />
                                                <Image src={'/support/icons/file.svg'} width={30} height={30} alt='send' className='cursor-pointer'></Image>
                                            </label>

                                            <button onClick={sendMessage}>
                                                <Image src={'/support/icons/send.svg'} width={30} height={30} alt='send'></Image>
                                            </button>
                                        </div>

                                        <div className='w-full'>
                                            {selectedFiles && selectedFiles.length > 0 && (
                                                <ul className='w-full space-y-1'>
                                                    {selectedFiles.map((file, i) => (
                                                        <li key={i} className='flex items-center w-full max-w-60'>
                                                            <p className='truncate w-3/4 overflow-hidden whitespace-nowrap text-ellipsis'>{file?.name}</p>
                                                            <button onClick={() => handleDelete(i)} className='ml-1'>
                                                                <svg
                                                                    width={25}
                                                                    height={25}
                                                                    viewBox="0 0 512 512"
                                                                    className='fill-white hover:fill-[rgba(194,114,79,1)]'
                                                                >
                                                                    <path d="M435.2 25.6H76.7996C48.6396 25.6 25.5996 48.64 25.5996 76.8V435.2C25.5996 463.36 48.6396 486.4 76.7996 486.4H435.2C463.36 486.4 486.4 463.36 486.4 435.2V76.8C486.4 48.64 463.36 25.6 435.2 25.6ZM465.92 435.2C465.92 452.096 452.096 465.92 435.2 465.92H76.7996C59.9036 465.92 46.0796 452.096 46.0796 435.2V76.8C46.0796 59.904 59.9036 46.08 76.7996 46.08H435.2C452.096 46.08 465.92 59.904 465.92 76.8V435.2ZM329.728 196.608L270.336 256L329.728 315.392C333.824 319.488 333.824 325.632 329.728 329.728C327.68 331.776 325.12 332.8 322.56 332.8C320 332.8 317.44 331.776 315.392 329.728L256 270.336L196.608 329.728C194.56 331.776 192 332.8 189.44 332.8C186.88 332.8 184.32 331.776 182.272 329.728C178.176 325.632 178.176 319.488 182.272 315.392L241.664 256L182.272 196.608C178.176 192.512 178.176 186.368 182.272 182.272C186.368 178.176 192.512 178.176 196.608 182.272L256 241.664L315.392 182.272C319.488 178.176 325.632 178.176 329.728 182.272C333.824 186.368 333.824 192.512 329.728 196.608Z"></path>
                                                                </svg>
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}