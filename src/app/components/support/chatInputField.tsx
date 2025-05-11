'use client';

import { useRef, useState } from "react";
import { saveFile } from '@/pages/api/support/sendMessageAPI';
import Image from "next/image";
import styles from "@/app/styles/home/variables.module.scss";
import { motion } from "framer-motion";
import { ChatData } from "@/lib/types/supportChat";
import { supabase } from "@/lib/supabase/supabaseClient";

const MAX_FILES_ALLOWED = 3;

type ClientErrors = {
    maxFilesAllowed: string;
}

interface Props {
    chatData?: ChatData;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket: any;
    userID?: string;
}

export function ChatInputField({chatData, socket, userID}: Props) {
    const [message, setMessage] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [clientErrors, setClientErrors] = useState<ClientErrors>({ maxFilesAllowed: '' });

    function getFile(selectedFiles: File[]) {
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

        return fileProperty;
    }

    const readFileAsDataURL = (file: File): Promise<string | ArrayBuffer | null> => {
        return new Promise((resolve, rejects) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => rejects(new Error("Error reading file"));
            reader.readAsDataURL(file);
        });
    }

    const processFiles = async (files: File[] | null): Promise<(string | ArrayBuffer | null)[]> => {
        if (!files || files.length === 0) return [];
        const filePromises = files.map((file) => readFileAsDataURL(file));
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
                fileUrl.push(`/uploads/supportFiles/${fileName}`);
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
                user_id: userID,
                status: chatData?.status
            }
            socket.emit("message", messageData);
            setSelectedFiles([]);
            setMessage("");
            if (process.env.NEXT_PUBLIC_ENV === 'production') {
                const { error } = await supabase
                    .from('messages')
                    .insert({
                        room_id: chatData?.id,
                        user_id: userID,
                        message: messageData.content,
                        sent_at: new Date().toISOString(),
                        file_url: fileUrl,
                    });
                if (error) console.error(error);
            }
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files: File[] = Array.from(e.target.files as FileList);
        const updatedFiles: File[] | null = [...(selectedFiles || []), ...files];

        if (updatedFiles.length > MAX_FILES_ALLOWED) {
            setClientErrors({
                maxFilesAllowed: `You can upload up to ${MAX_FILES_ALLOWED} files only`,
            });
        } else {
            setClientErrors({ maxFilesAllowed: '' });
        }

        setSelectedFiles(updatedFiles.slice(0, MAX_FILES_ALLOWED));
        e.target.value = '';
    };

    const handleDelete = (index: number) => {
        const updatedFiles = selectedFiles.filter((_, i: number) => i !== index);

        if (updatedFiles.length <= MAX_FILES_ALLOWED) {
            setClientErrors({ maxFilesAllowed: '' });
        }

        setSelectedFiles(updatedFiles);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const textAreaTarget = event.target as HTMLTextAreaElement;

        if (!event.shiftKey && event.key === "Enter" && message.trim() !== '') {
            event.preventDefault();
            textAreaTarget.style.height = '24px';
            textAreaTarget.style.overflowY = 'hidden';
            sendMessage();
            setMessage('');
        }
    }

    return (
        <div>
            {chatData?.status === true ? (
                <div className='text-center text-white bg-[rgba(6,6,6,.65)] p-2 mx-3 rounded-xl'>
                    <p>problem has been solved</p>
                </div>
            ) : (
                <div className={`flex flex-col ${selectedFiles?.length === 0 || selectedFiles === null ? null : 'gap-2'} bg-[rgba(6,6,6,.65)] p-2 mx-3 rounded-xl`}>
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: clientErrors?.maxFilesAllowed ? 1 : 0, height: clientErrors?.maxFilesAllowed ? 30 : 0 }}
                        transition={{ duration: .3 }}
                        className="text-center text-orange-300 text-[13px] sm:text-[18px]"
                    >
                        {clientErrors?.maxFilesAllowed}
                    </motion.p>
                    <div className='flex flex-row gap-2 items-center select-none'>
                        <textarea value={message} rows={1} onChange={handleInputChange} onKeyDown={handleKeyDown} autoFocus maxLength={1000} placeholder='WRITE A MESSAGE...' className={`w-full bg-transparent outline-none font-extralight tracking-[1px] text-balance resize-none ${styles.custom_scroll} caret-white overflow-auto`} />

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
                                )
                                )}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}