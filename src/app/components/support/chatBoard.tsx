'use client';
import { motion } from 'framer-motion';
import Image from "next/image";
import { useEffect, useState, useRef, useCallback, useReducer } from 'react';
import styles from "@/app/styles/home/variables.module.scss";
import { ChatData, UserData, UsersData, Message } from "@/lib/types/supportChat";

interface Props {
    userData: UserData;
    usersData: UsersData[];
    chatData: ChatData;
    messages:  Message[];
    isLoading: boolean;
}

interface State {
    isAtBottom: boolean;
    newMessage: boolean;
    lastSeenMessage: number | null;
}

type Action =
    | { type: 'SCROLL_TO_BOTTOM'; payload: boolean }
    | { type: 'SET_NEW_MESSAGE'; payload: boolean }
    | { type: 'SET_LAST_SEEN_MESSAGE'; payload: number | null };

const initialState = {
    isAtBottom: false,
    newMessage: false,
    lastSeenMessage: null,
}

const reducer = (state: State, action: Action) => {
    switch (action.type) {
        case 'SCROLL_TO_BOTTOM':
            return { ...state, isAtBottom: action.payload };
        case 'SET_NEW_MESSAGE':
            return { ...state, newMessage: action.payload };
        case 'SET_LAST_SEEN_MESSAGE':
            return { ...state, lastSeenMessage: action.payload };
        default:
            return state;
    }
}

export function ChatBoard({ userData, usersData, chatData, messages, isLoading }: Props) {
    const [showImage, setShowImage] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const messageRefs = useRef<HTMLElement[]>([]);
    const observer = useRef<IntersectionObserver | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [state, dispatch] = useReducer(reducer, initialState);

    const [timing, setTiming] = useState(false);

    const scrollToBottom = useCallback(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "instant" });
    }, []);

    useEffect(() => {
        const handleUnloadOrPopState = async () => {
            if (state.lastSeenMessage !== null) {
                const payload = {
                    userID: userData?.id,
                    roomID: chatData.id,
                    lastSeenMessage: state.lastSeenMessage,
                };

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
    }, [state.lastSeenMessage, userData?.id, chatData.id]);

    useEffect(() => {
        const fetchLastSeenMessage = async () => {
            if (!userData?.id || !chatData.id) {
                console.error('User ID or Chat Data ID is undefined');
                return;
            }

            try {
                const lastSeenMessage = await fetch(`/api/support/lastMessageAPI?userID=${userData?.id}&roomID=${chatData.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (lastSeenMessage.status === 204 || lastSeenMessage.headers.get('Content-Length') === '0') {
                    console.warn('No last seen message found for this user and room');
                    return;
                }

                const lastSeenMessageData = await lastSeenMessage.json();

                if (lastSeenMessage.ok && lastSeenMessageData.last_message_id !== undefined) {
                    messageRefs.current[lastSeenMessageData.last_message_id]?.scrollIntoView({ behavior: "smooth" });
                } else {
                    console.warn('Error fetching last seen message:');
                }
            } catch (error) {
                console.error('Error fetching last seen message:', error);
            }
        };

        if (userData?.id && chatData.id) {
            fetchLastSeenMessage();
        }
    }, [chatData.id, userData?.id]);

    const handleScrollAndMessages = useCallback(() => {
        const element = scrollContainerRef.current;

        if (element) {
            const isBottom = Math.ceil(element.scrollTop + element.clientHeight) >= element.scrollHeight - 20;
            dispatch({ type: 'SCROLL_TO_BOTTOM', payload: isBottom });

            if (isBottom) {
                messages.forEach((msg, index) => {
                    msg.unreaded = false;
                    if (state.lastSeenMessage === null || index > state.lastSeenMessage) {
                        dispatch({ type: 'SET_LAST_SEEN_MESSAGE', payload: index })
                    }
                });
            }
        }

        const timeout = setTimeout(() => {
            const hasUnreadMessages = messages.some((msg) => msg.unreaded === true);
            if (hasUnreadMessages) {
                dispatch({ type: 'SET_NEW_MESSAGE', payload: true });
            }
        }, 100)

        return () => clearTimeout(timeout);

    }, [messages, state.lastSeenMessage]);

    useEffect(() => {
        handleScrollAndMessages();
    }, [handleScrollAndMessages])

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

    const scrollToUnreadMessage = () => {

        const firstUnreadIndex = messages.findIndex((msg) => msg.unreaded === true);
        const lastMessageIndex = messages.length - 1

        if (messageRefs.current[firstUnreadIndex]) {
            messageRefs.current[firstUnreadIndex].scrollIntoView({ behavior: "smooth" });
        } else if (!state.isAtBottom && !messageRefs.current[firstUnreadIndex]) {
            messageRefs.current[lastMessageIndex].scrollIntoView({ behavior: "smooth" });
        }

    }

    useEffect(() => {
        let messageIndex = 0;

        observer.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const dataId: string = String(entry.target.getAttribute("data-id"));
                if (entry.isIntersecting) {
                    const messageId = parseInt(dataId, 10);

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

    useEffect(() => {
        if (state.isAtBottom) {
            scrollToBottom();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, state.isAtBottom]);

    return (
        <div className='flex'>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoading ? 0 : 1 }}
                transition={{ duration: .3 }}
                className='relative w-full flex flex-col gap-4 px-4 mx-auto max-w-[750px]'
            >
                <button onClick={scrollToUnreadMessage} className={`w-10 h-10 mr-4 rounded-full bg-[#ebebeb] absolute right-5 bottom-5 duration-200 ease-in-out hover:bg-[#c5c5c5] ${state.newMessage === true || !state.isAtBottom ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    {state.newMessage && !state.isAtBottom ? <p className={`text-[#C67E5F] text-center font-semibold `}>NEW</p> : <Image alt='down' src={'/support/icons/down.svg'} width={50} height={50} className='m-auto' />}
                </button>

                <div ref={scrollContainerRef} className={`w-full h-[600px] sm:w-auto sm:min-w-[400px] md:min-w-[650px] sm:max-w-[750px] bg-[rgba(6,6,6,.65)] flex flex-col gap-3 items-center rounded-xl px-3 sm:px-5 py-5 overflow-scroll overflow-x-hidden ${styles.custom_chat_scroll}`}>

                    <div className='text-base sm:text-xl font-extralight tracking-[5px] text-balance'>
                        <h3>{chatData?.title}</h3>
                    </div>

                    <div className='w-full text-base text-center '>
                        <p>{chatData?.description}</p>
                    </div>

                    <div className='flex flex-row justify-center gap-2'>
                        {Array.isArray(chatData.files) &&
                            chatData?.files.map((file, i) => (
                                <div key={i}
                                    onClick={() => handleImageClick(`http://localhost:3000/${file}`)}
                                >
                                    <Image
                                        src={`http://localhost:3000/${file}`}
                                        alt={`Image ${i + 1}`}
                                        width={80}
                                        height={80}
                                        className={`rounded cursor-pointer`}
                                        loading='lazy'
                                    />
                                </div>
                            ))}
                    </div>

                    <div className='w-full h-full text-base sm:text-lg flex flex-col gap-3 pb-5 font-extralight tracking-[1px] text-balance'>
                        {messages.map((msg, index) => {
                            const isFirstMessageInSequence = index === 0 || messages[index - 1]?.user_id !== msg.user_id;
                            return (
                                <motion.div
                                    key={index}
                                    className={`flex flex-col w-full last:pb-5 ${userData?.id === msg.user_id || userData?.id === msg.user_id
                                        ? 'items-end'
                                        : 'items-start'
                                        }`}
                                    data-id={index}
                                >
                                    {isFirstMessageInSequence && (
                                        <p className='text-white tracking-widest'>
                                            {usersData.find(user => user.id === msg.user_id || user.id === msg.user_id)?.username || 'UNKNOWN'}
                                        </p>
                                    )}

                                    {(msg?.content || msg?.message) ? (
                                        <div>
                                            <p className={`bg-[rgba(194,114,79,1)] rounded-lg py-2 px-3`}>
                                                {msg?.content || msg?.message}
                                            </p>
                                        </div>
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

                                    <div
                                        ref={(el) => {
                                            if (el) {
                                                messageRefs.current[index] = el;
                                            }
                                        }} >

                                    </div>
                                    <div ref={chatEndRef}></div>
                                </motion.div>
                            );
                        })}
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
                                        alt="Scaled image"
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
                    </div>
                </div>
            </motion.div>
        </div>
    )
}