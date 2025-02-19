"use client";
import { Header } from "@/app/components/header";
import { Loader } from "@/app/components/load";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import { saveFile } from '@/pages/api/support/sendMessageAPI';
import styles from "@/app/styles/home/variables.module.scss";
import { motion } from "framer-motion";

import { K2D } from "next/font/google";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

const validationSchema = Yup.object().shape({
    title: Yup.string()
        .trim()
        .min(4, 'Title must be at least 4 characters')
        .max(100, 'Title cannot exceed 100 characters')
        .required('Please enter a title'),
    description: Yup.string()
        .trim()
        .min(1, 'The description must be at least 10 characters long')
        .max(400, 'The description should not be longer than 400 characters')
        .matches(/\S/, 'Description cannot be empty or whitespace')
        .required('Please explain your problem'),
    file: Yup.mixed()
});

const MAX_FILES_ALLOWED = 3;

export default function CreateSupportChat() {
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [clientErrors, setClientErrors] = useState({});
    const [serverErrors, setServerErrors] = useState({});

    const [cookies] = useCookies();
    const router = useRouter();

    useEffect(() => {
        const timeout = setTimeout(() => {
            setIsLoading(false);
        }, 300)
        return () => clearTimeout(timeout);
    }, [])

    useEffect(() => {
        if (!cookies.auth_token) {
            router.push('/login')
        }
    }, [cookies]);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
    });

    useEffect(() => {
        const allErrors = { ...errors };
        
        if (selectedFiles && selectedFiles.length > MAX_FILES_ALLOWED) {
            allErrors.maxFilesLimit = `You can upload up to ${MAX_FILES_ALLOWED} files only`;
        }

        if (Object.keys(allErrors).length > 0) {
            setClientErrors(allErrors);
        }else {
            const timeout = setTimeout(() => {
                setClientErrors({});
                return () => clearTimeout(timeout);
            }, 300)
        }

    }, [errors, selectedFiles]);

    const onSubmit = async (data) => {

        const fileURL = [];

        if (selectedFiles) {
            const filesData = await processFiles(selectedFiles);
            const fullFileName = fetchFileData(selectedFiles);

            for (let i = 0; i < selectedFiles.length; i++) {
                const fileName = `${Date.now()}_${fullFileName[i].name}.${fullFileName[i].extension}`;
                fileURL.push(`/uploads/${fileName}`);
            }

            try {
                await saveFile(filesData, fileURL);
            } catch (error) {
                console.error(error);
            }
        }

        try {
            const payload = {
                ...data,
                cookies: cookies,
                files: fileURL,
            }

            const response = await fetch('/api/support/createSupportChatAPI', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                router.push(result.redirectUrl);
            } else {
                console.log('error creating chat')
                setServerErrors(result.errors)
            }

        } catch (errors) {
            console.error("Error:", errors);
        }
    }

    const handleFileChange = async (e) => {
        const files = e.target.files
        if (files.length > 0) {
            setSelectedFiles([...files])
        }
        e.target.value = '';
    }

    const processFiles = async (files: FileList | null): Promise<string | ArrayBuffer | null> => {
        if (!files || files.length === 0) return [];
        const filePromises = Array.from(files.map((file) => readFileAsDataURL(file)))
        return await Promise.all(filePromises)
    }

    const readFileAsDataURL = (file: file): Promise<string | ArrayBuffer | null> => {
        return new Promise((resolve, rejects) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => rejects(new Error("Error reading file"));
            reader.readAsDataURL(file);
        })
    }

    const fetchFileData = (files: FileList) => {
        const fileProperty = [];
        for (let i = 0; i < files.length; i++) {
            const fileName = files[i].name;
            const lastDotIndex = fileName.lastIndexOf('.');

            const name = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
            const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex + 1) : '';

            fileProperty[i] = {
                name: name,
                extension: extension,
                size: files[i].size
            };
        }
        return fileProperty;
    }

    const handleInputChange = (e) => {
        const textarea = e.target;
        textarea.style.height = 'auto';
        const maxHeight = 4 * parseFloat(getComputedStyle(textarea).lineHeight);
        if (textarea.scrollHeight > maxHeight) {
            textarea.style.height = `${maxHeight}px`;
            textarea.style.overflowY = 'scroll';
        } else {
            textarea.style.height = `${textarea.scrollHeight}px`;
            textarea.style.overflowY = 'hidden';
        }
    }

    const handleDeleteFile = (index) => {
        setSelectedFiles(selectedFiles.filter((value, i) => i !== index));
    }

    return (
        <div className={`w-full h-[90vh] mt-[100px] bg-[url('/login/gradient_bg.png')] object-cover bg-cover bg-center bg-no-repeat ${MainFont.className} text-white caret-transparent`}>
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
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isLoading ? 0 : 1 }}
                    transition={{ duration: .3 }}
                    className='h-full flex flex-col justify-center items-center gap-4 text-balance text-center'
                >
                    <Header />
                    <div className='h-full flex flex-col justify-center items-center gap-4 text-balance text-center'>
                        <h2 className="uppercase text-lg">DESCRIBE THE PROBLEM, ATTACH SCREENSHOTS IF NECESSARY</h2>
                        <div className="flex justify-center items-center h-auto max-w-[730px] py-4 px-6 bg-[rgba(6,6,6,.64)] rounded-lg select-none">
                            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col justify-center items-center gap-4">
                                <div>
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: clientErrors.title?.message || serverErrors?.title ? 1 : 0, height: clientErrors.title?.message || serverErrors?.title ? 30 : 0 }}
                                        transition={{ duration: .3 }}
                                        className="text-orange-300 text-[13px] sm:text-[18px]"
                                    >
                                        {clientErrors.title?.message || serverErrors?.title}
                                    </motion.p>
                                    <input type="text" {...register("title")} className="w-[250px] sm:w-[350px] md:w-[500px] border-b-2 tracking-wider bg-transparent text-center outline-none border-[#F5DEB3] select-none text-base md:text-2xl" placeholder="Title" />
                                </div>

                                <div className="w-full flex flex-col text-center">
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: clientErrors.description?.message || serverErrors?.description  ? 1 : 0, height: clientErrors.description?.message || serverErrors?.description  ? 30 : 0 }}
                                        transition={{ duration: .3 }}
                                        className="text-orange-300 text-[13px] sm:text-[18px]"
                                    >
                                        {clientErrors.description?.message || serverErrors?.description }
                                    </motion.p>
                                    <textarea rows={4} maxLength={1000} onChange={handleInputChange} placeholder="DESCRIBE PROBLEM..." {...register("description")} className={`w-full bg-transparent outline-none font-extralight tracking-[1px] py-2 px-3 text-balance resize-none border-2 rounded text-base md:text-lg ${styles.custom_scroll} border-[#F5DEB3]`} />
                                </div>

                                <div className={`w-full flex flex-col items-start ${selectedFiles?.length === 0 || selectedFiles === null ? null : 'gap-2'}`}>
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: clientErrors?.maxFilesLimit ? 1 : 0, height: clientErrors?.maxFilesLimit ? 30 : 0 }}
                                        transition={{ duration: .3 }}
                                        className="text-orange-300 text-[13px] sm:text-[18px] place-self-center"
                                    >
                                        {clientErrors?.maxFilesLimit}
                                    </motion.p>

                                    <label htmlFor="file-input" className="place-self-start select-none">
                                        <input id="file-input" type="file" {...register("file", {
                                            onChange: (e) => {
                                                handleFileChange(e)
                                            }
                                        })}
                                            multiple accept='image/*,video/*'
                                            className="hidden"
                                        />
                                        <button type="button" className="py-2 px-4 bg-[#C2724F] rounded cursor-pointer select-none border border-[#F5DEB3] transition-colors duration-75 hover:bg-[#c2724f91]" onClick={() => document.getElementById('file-input')?.click()}>FILES</button>
                                    </label>
                                    <div className={`place-self-start`}>
                                        {selectedFiles && selectedFiles.length > 0 && (
                                            <ul>
                                                {selectedFiles.map((file, i) => (
                                                    <li key={i} className="flex flex-row items-center gap-2 text-left">
                                                        {file.name}
                                                        <button onClick={() => handleDeleteFile(i)}>
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
                                <input type="submit" value="SEND" className="w-[250px] h-[50px] text-lg tracking-wider transition-colors duration-75 rounded border border-[#F5DEB3] bg-[#C2724F] hover:bg-[#c2724f91] select-none" />
                            </form>
                        </div>
                    </div>

                </motion.div>
            )}

        </div>
    )
}