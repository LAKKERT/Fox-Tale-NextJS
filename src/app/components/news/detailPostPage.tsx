'use client'
import { Loader } from "@/app/components/load";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef, ChangeEvent } from "react";
import { useCookies } from "react-cookie";
import { useUserStore } from "@/stores/userStore";
import { K2D } from "next/font/google";
import { motion, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { useForm, useFieldArray } from "react-hook-form";
import * as Yup from "yup";
import _ from "lodash";
import { yupResolver } from "@hookform/resolvers/yup";
import { saveFile } from "@/pages/api/news/saveImagesAPI";
import styles from "@/app/styles/home/variables.module.scss";
import { useRouter } from "next/navigation";

import { ContentBlock, FormValues, FileMetadata } from "@/lib/types/news";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

const validationSchema = Yup.object().shape({
    title: Yup.string().required("Title is required"),
    description: Yup.string().required("Description is required"),
    add_at: Yup.date().nullable(),
    content_blocks: Yup.array().of(
        Yup.object().shape({
            id: Yup.string().required(),
            heading: Yup.string().required("Heading is required"),
            covers: Yup.mixed<File | Blob | string>()
                .nullable()
                .defined(),
            horizontal_position: Yup.number()
                .min(0)
                .max(100)
                .required(),
            vertical_position: Yup.number()
                .min(0)
                .max(100)
                .required(),
            order_index: Yup.number().required(),
            content: Yup.array().of(
                Yup.object().shape({
                    id: Yup.string().required(),
                    text: Yup.string().required("Content is required"),
                    image: Yup.mixed<File | string>()
                        .nullable(),
                    order_index: Yup.number().required()
                })
                .defined()
            ).required(),
        })
            .defined()
    ).required(),
});

export function PostDetailComponent({ postID }: { postID: { id: number } }) {
    const [postData, setPostData] = useState<FormValues>();
    const userData = useUserStore((state) => state.userData);
    const [isLoading, setIsLoading] = useState(true);
    const [editModeActive, setEditModeActive] = useState(false);
    const [deletePost, setDeletePost] = useState(false);
    const [cookies] = useCookies(['auth_token']);
    const router = useRouter();

    const imgRef = useRef<HTMLElement[]>([]);
    const textAreaRef = useRef<HTMLElement[][]>([]);

    const debouncedUpdate = useRef(
        _.debounce((block, contentBlockIndex, h, v) => {
            update(contentBlockIndex, {
                ...block[contentBlockIndex],
                vertical_position: v,
                horizontal_position: h
            });
        }, 300)
    ).current;

    const {
        register, control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
            resolver: yupResolver(validationSchema),
            defaultValues: {
                content_blocks: [],
            }
        });

    const { fields: content_blocks, append, update, replace } = useFieldArray({
        control,
        name: "content_blocks",
        keyName: uuidv4(),
    });

    useEffect(() => {
        const fetchPostData = async () => {
            try {
                const response = await fetch(`/api/news/fetchPostDataAPI?postID=${postID.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                const result = await response.json();

                if (response.ok) {
                    const formattedData = result.result?.content_blocks?.map((block: ContentBlock, index: number) => ({
                        id: uuidv4(),
                        heading: block.heading,
                        covers: block.covers,
                        horizontal_position: Number(block.horizontal_position),
                        vertical_position: Number(block.vertical_position),
                        order_index: index,
                        content: block.content?.map((content, contentIndex) => ({
                            id: uuidv4(),
                            text: content.text || "",
                            image: content.image,
                            order_index: contentIndex
                        })) || []
                    })) || [];

                    reset({
                        title: result.result.title || "",
                        description: result.result.description || "",
                        content_blocks: formattedData
                    });

                    setPostData({
                        title: result.result.title || "",
                        description: result.result.description || "",
                        add_at: result.result.add_at,
                        content_blocks: formattedData
                    });

                    setTimeout(() => {
                        setIsLoading(false);
                    }, 300)
                }
            } catch (error) {
                console.error('Error fetching post data:', error);
                setIsLoading(false);
            }
        }

        fetchPostData()
    }, [userData, cookies, router]);

    const editMode = () => {
        if (deletePost === true) {
            setDeletePost(false);
        } else {
            const value = editModeActive;
            setEditModeActive(!value);
        }
    }

    useEffect(() => {
        if (!editModeActive && postData) {
            reset({
                title: postData.title || "",
                description: postData.description || "",
                content_blocks: postData.content_blocks || []
            });
        }
    }, [editModeActive, postData, reset]);

    const deletePostHandle = () => {
        if (editModeActive === true) {
            setDeletePost(false);
        } else {
            const value = deletePost;

            setDeletePost(!value);
        }
    }

    const addParagraph = () => {
        const newOrder = content_blocks.length > 0 ? content_blocks[content_blocks.length - 1].order_index + 1 : 0;

        append({
            id: uuidv4(),
            heading: '',
            horizontal_position: 50,
            vertical_position: 50,
            covers: null,
            order_index: newOrder,
            content: [{ id: uuidv4(), text: '', image: null, order_index: 0 }]
        });
    };

    const addContentBlock = (contentBlockIndex: number) => {
        const contentBlock = content_blocks[contentBlockIndex];
        const newContentOrder = contentBlock.content.length;
        update(contentBlockIndex, {
            ...contentBlock,
            content: [...contentBlock.content, { id: uuidv4(), text: '', image: null, order_index: newContentOrder }]
        });
    };

    const deleteContentBlock = (contentBlockIndex: number, contentIndex: number) => {
        const updatedcontent = content_blocks[contentBlockIndex].content.filter(
            (_, idx) => idx !== contentIndex
        ).map((content, index) => ({ ...content, order_index: index }));

        update(contentBlockIndex, {
            ...content_blocks[contentBlockIndex],
            content: updatedcontent
        });
    };

    const deleteParagraph = (paragraphIndex: number) => {
        const updatedContents = content_blocks
            .filter((_, idx) => idx !== paragraphIndex)
            .map((contentBlock, index) => ({ ...contentBlock, order_index: index }));

        replace(updatedContents);
    };

    const handleCoverChange = async (contentBlockIndex: number, file: File) => {
        const updatedParagraph = {
            ...content_blocks[contentBlockIndex],
            covers: file
        };
        update(contentBlockIndex, updatedParagraph);
    };

    const handleImageChange = (contentBlockIndex: number, contentIndex: number, file: File) => {
        const updatedcontent = content_blocks[contentBlockIndex].content.map((content, idx) =>
            idx === contentIndex ? { ...content, image: file } : content
        );

        update(contentBlockIndex, {
            ...content_blocks[contentBlockIndex],
            content: updatedcontent
        });
    };

    const processFiles = useCallback(async (files: File[]) => {
        return Promise.all(
            files.map(file => {
                if (!(file instanceof File)) {
                    return Promise.resolve(null);
                }
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            })
        );
    }, []);

    const getFileMetadata = useCallback((file: File): FileMetadata => {
        const fileName = file.name;
        const lastDotIndex = fileName.lastIndexOf(".");
        return {
            name: lastDotIndex > -1 ? fileName.substring(0, lastDotIndex) : fileName,
            extension: lastDotIndex > -1 ? fileName.substring(lastDotIndex + 1) : '',
            size: file.size
        };
    }, []);

    const onSubmit = async (data: FormValues) => {
        try {
            const newCovers = data.content_blocks
                .map(p => p.covers)
                .filter(covers => covers instanceof File) as File[];

            const processedCovers = await processFiles(newCovers) as string[];
            const coversMetadata = newCovers.map(file => getFileMetadata(file));
            const coversURL = coversMetadata.map(meta =>
                `/uploads/news/${Date.now()}_${meta.name}.${meta.extension}`
            );

            let coverIndex = 0;
            data.content_blocks.forEach(contentBlock => {
                if (contentBlock.covers instanceof File) {
                    contentBlock.covers = coversURL[coverIndex];
                    coverIndex++;
                }
            });

            await saveFile(processedCovers, coversURL);

            const newContentImages = data.content_blocks
                .flatMap(p => p.content.map(c => c.image))
                .filter(img => img instanceof File) as File[];

            const processedImages = await processFiles(newContentImages) as string[];
            const imagesMetadata = newContentImages.map(file => getFileMetadata(file));
            const imagesURL = imagesMetadata.map(meta =>
                `/uploads/news/${Date.now()}_${meta.name}.${meta.extension}`
            );

            let imageIndex = 0;
            data.content_blocks.forEach(contentBlock => {
                contentBlock.content.forEach(content => {
                    if (content.image instanceof File) {
                        content.image = imagesURL[imageIndex];
                        imageIndex++;
                    }
                });
            });

            await saveFile(processedImages, imagesURL);

            const payload = {
                data,
                postID: postID.id,
            };

            const response = await fetch('/api/news/addNewsAPI', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cookies.auth_token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setEditModeActive(false);
                window.location.reload();
            } else {
                console.error('Error adding new post:');
            }
        } catch (error) {
            console.error('Error updating post:', error);
        }
    };

    const handleDeletePost = async () => {
        try {
            const response = await fetch(`/api/news/addNewsAPI`, {
                method: 'DELETE',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': `Bearer ${cookies.auth_token}`
                },
                body: JSON.stringify({ postID: postID.id })
            });

            const result = await response.json();

            if (response.ok) {
                router.push(result.redirectUrl);
            } else {
                console.error('Error deleting post:');
            }

        } catch (error) {
            console.error('Error deleting post:', error);
        }
    }

    const handlePositionChange = (contentBlockIndex: number, hValue: number, vValue: number) => {
        if (imgRef.current) {
            imgRef.current[contentBlockIndex].style.objectPosition = `${hValue}% ${vValue}%`;
        }
    }

    const handleSliderChange = (contentBlockIndex: number, isHorizontal: boolean, e: ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);

        const newH = isHorizontal ? value : content_blocks[contentBlockIndex].horizontal_position;
        const newV = !isHorizontal ? value : content_blocks[contentBlockIndex].vertical_position;

        handlePositionChange(contentBlockIndex, newH, newV);
        debouncedUpdate(content_blocks, contentBlockIndex, newH, newV);
    }

    const [windowSize, setWindowSize] = useState({
        width: typeof window !== "undefined" ? window.innerWidth : 0,
        height: typeof window !== "undefined" ? window.innerHeight : 0,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const updateTextareas = () => {
            document.querySelectorAll('textarea').forEach(textarea => {
                textarea.style.height = "auto";
                textarea.style.height = `${textarea.scrollHeight}px`;
            });
        };

        updateTextareas();

        const resizeObserver = new ResizeObserver(_.debounce(updateTextareas, 100));

        const container = document.querySelector('.your-container-class');
        if (container) resizeObserver.observe(container);

        return () => resizeObserver.disconnect();
    }, [windowSize, editModeActive]);

    return (
        <div className={`max-w-[768px] xl:max-w-[1110px] flex flex-col justify-center items-center gap-0 lg:max-w-8xl mx-auto mt-[100px] px-4 pb-8 ${MainFont.className} text-[#F5DEB3] caret-transparent`}>
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
                <LazyMotion features={domAnimation}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isLoading ? 0 : 1 }}
                        transition={{ duration: .3 }}
                        className="w-full"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isLoading ? 0 : 1 }}
                            transition={{ duration: .3 }}
                            className="h-full"
                        >
                            <form onSubmit={handleSubmit(onSubmit)}
                                className="flex flex-col gap-8"
                            >
                                <motion.div
                                    className=" min-h-[260px] max-w-[1110px] flex flex-col justify-evenly gap-3 text-center text-balance"
                                >
                                    <h1 className={`text-xl md:text-2xl ${editModeActive ? 'hidden' : 'block'}`}>
                                        {postData?.title}
                                    </h1>

                                    <motion.input
                                        {...register('title')}
                                        className={` w-full bg-transparent outline-none border-b-2 border-white focus:border-orange-400 transition-colors duration-300 text-xl md:text-2xl text-center focus:caret-white ${editModeActive ? 'block' : 'hidden'}`}
                                    />

                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: errors.title?.message ? 30 : 0, height: errors.title?.message ? 'auto' : '0px' }}
                                        transition={{ duration: .3 }}
                                        className=" text-orange-300 text-[13px] sm:text-[18px]"
                                    >
                                        {errors.title?.message}
                                    </motion.p>

                                    <p
                                        className={`text-base md:text-lg ${editModeActive ? 'hidden' : 'block'}`}
                                    >
                                        {postData?.description}
                                    </p>

                                    <motion.textarea
                                        {...register('description')}
                                        onInput={(e) => {
                                            const target = e.target as HTMLTextAreaElement;

                                            target.style.height = "auto";
                                            target.style.minHeight = "50px";
                                            target.style.height = `${target.scrollHeight}px`;
                                        }}
                                        className={`text-center text-sm md:text-base text-balance text-[#F5DEB3] overflow-hidden py-2 w-full border-2 bg-transparent outline-none resize-none rounded border-white focus:border-orange-400 transition-colors duration-300 ${styles.custom_scroll} ${editModeActive ? 'block' : 'hidden'} focus:caret-white`}
                                        style={{

                                            maxHeight: "70vh",
                                            boxSizing: "border-box"
                                        }}
                                    />

                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: errors.description?.message ? 30 : 0, height: errors.description?.message ? 'auto' : '0px' }}
                                        transition={{ duration: .3 }}
                                        className=" text-orange-300 text-[13px] sm:text-[18px]"
                                    >
                                        {errors.description?.message}
                                    </motion.p>

                                    <div className="w-full flex flex-row justify-between">
                                        <p className="text-left text-base">
                                            {postData?.add_at ?
                                                new Date(postData.add_at).toLocaleString("ru-RU", {
                                                    dateStyle: 'short'
                                                })
                                                :
                                                'Н/Д'}
                                        </p>
                                        {userData?.role === "admin" && (
                                            <div className="flex flex-row gap-3">
                                                <button type="button" onClick={editMode}>EDIT</button>
                                                <button type="button" onClick={deletePostHandle}>DELETE</button>
                                            </div>
                                        )}
                                    </div>

                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: deletePost ? '60px' : '0px', opacity: deletePost ? 1 : 0 }}
                                        transition={{ duration: .3 }}
                                        className={`${userData?.role === 'admin' ? 'block' : 'hidden'}`}
                                    >
                                        <p>Do you really want to delete this article?</p>
                                        <div className="flex flex-row justify-center gap-2">
                                            <button type="button" onClick={() => handleDeletePost()} >Yes</button>
                                            <button type="button" onClick={() => setDeletePost(false)}>No</button>
                                        </div>
                                    </motion.div>
                                </motion.div>

                                <AnimatePresence mode="wait">
                                    {content_blocks && content_blocks?.map((contentBlock, contentBlockIndex) => {
                                        return (
                                            <motion.div
                                                layout={'position'}
                                                key={contentBlock.id}
                                                transition={{ duration: .3, type: 'spring', bounce: 0.25 }}
                                                className=" max-w-[1110px] flex flex-col justify-center items-center gap-4"
                                            >
                                                <h2
                                                    className={`text-center text-xl wrap text-balance ${editModeActive ? 'hidden' : 'block'}`}
                                                >
                                                    {contentBlock.heading}
                                                </h2>

                                                <input
                                                    {...register(`content_blocks.${contentBlockIndex}.heading`)}
                                                    className={` w-full bg-transparent outline-none border-b-2 border-white focus:border-orange-400 transition-colors duration-300 text-xl text-center focus:caret-white ${editModeActive ? 'block' : 'hidden'}`}
                                                    onChange={(e) => {
                                                        update(contentBlockIndex, {
                                                            ...contentBlock,
                                                            heading: e.target.value
                                                        })
                                                    }}
                                                />

                                                <motion.p
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: errors.content_blocks?.[contentBlockIndex]?.heading?.message ? 1 : 0, height: errors.content_blocks?.[contentBlockIndex]?.heading?.message ? 'auto' : '0px' }}
                                                    transition={{ duration: .3 }}
                                                    className={` text-orange-300 text-[13px] sm:text-[18px] ${editModeActive ? 'block' : 'hidden'}`}
                                                >
                                                    {errors.content_blocks?.[contentBlockIndex]?.heading?.message}
                                                </motion.p>

                                                <motion.p
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: errors.title?.message ? 30 : 0, height: errors.title?.message ? 'auto' : '0px' }}
                                                    transition={{ duration: .3 }}
                                                    className={` text-orange-300 text-[13px] sm:text-[18px] ${editModeActive ? 'block' : 'hidden'}`}
                                                >
                                                    {errors.title?.message}
                                                </motion.p>

                                                {contentBlock.covers && (
                                                    <motion.div
                                                        layout="position"
                                                        className="w-full h-64 relative mb-4"
                                                    >
                                                        <Image
                                                            ref={e => {
                                                                if (e) {
                                                                    imgRef.current[contentBlockIndex] = e
                                                                }
                                                            }}
                                                            src={typeof contentBlock.covers === 'string'
                                                                ? `http://localhost:3000/${contentBlock.covers}`
                                                                : URL.createObjectURL(contentBlock.covers)}
                                                            alt="covers"
                                                            fill
                                                            className={`transform-gpu rounded object-cover`}
                                                            style={{ objectPosition: `${contentBlock.horizontal_position}% ${contentBlock.vertical_position}%` }}
                                                            sizes="(max-width: 768px) 100vw, 50vw"
                                                            quality={100}
                                                        />
                                                    </motion.div>
                                                )}

                                                <motion.div
                                                    layout={'position'}
                                                    className={`w-full flex flex-col items-center ${content_blocks[contentBlockIndex]?.covers ? "gap-0" : ""}  `}
                                                >
                                                    <input
                                                        type="file"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                handleCoverChange(contentBlockIndex, file);
                                                            }
                                                        }}
                                                        className="hidden"
                                                        id={`covers-${contentBlockIndex}`}
                                                    />

                                                    <label
                                                        htmlFor={`covers-${contentBlockIndex}`}
                                                        className={` min-w-[185px] text-center py-2 mb-3 px-4 bg-[#C2724F] rounded cursor-pointer select-none border border-[#F5DEB3] transition-colors duration-75 hover:bg-[#c2724f91] ${editModeActive ? 'block' : 'hidden'}`}
                                                    >
                                                        {contentBlock.covers ? 'Change covers' : 'Upload covers'}
                                                    </label>

                                                    <div
                                                        className={`w-full flex flex-col items-center gap-6`}
                                                    >
                                                        <input type="range" {...register(`content_blocks.${contentBlockIndex}.horizontal_position`, { valueAsNumber: true })} onChange={(e) => handleSliderChange(contentBlockIndex, true, e)} min="0" max="100" className={`${styles.custom_input_range} ${editModeActive ? 'block' : 'hidden'} ${contentBlock.covers ? 'block' : 'hidden'}`} />
                                                        <input type="range" {...register(`content_blocks.${contentBlockIndex}.vertical_position`, { valueAsNumber: true })} onChange={(e) => handleSliderChange(contentBlockIndex, false, e)} min="0" max="100" className={`${styles.custom_input_range} ${editModeActive ? 'block' : 'hidden'} ${contentBlock.covers ? 'block' : 'hidden'}`} />
                                                    </div>
                                                </motion.div>

                                                <div className="w-full relative flex-col flex gap-4">
                                                    <AnimatePresence mode="popLayout">
                                                        {contentBlock.content.map((content, contentIndex) => {
                                                            return (
                                                                <motion.div
                                                                    key={content.id}
                                                                    layout={'position'}
                                                                    transition={{ duration: .3, type: 'spring', bounce: 0.25 }}
                                                                    className=" w-full flex flex-col justify-center items-center gap-2 p-3"
                                                                >
                                                                    {content.image && (
                                                                        <div className="w-full h-96 relative mb-4">
                                                                            <Image
                                                                                src={typeof content.image === 'string'
                                                                                    ? `http://localhost:3000/${content.image}`
                                                                                    : URL.createObjectURL(content.image)}
                                                                                alt="Content"
                                                                                fill
                                                                                className="rounded object-contain"
                                                                                sizes="(max-width: 768px) 100vw, 50vw"
                                                                                quality={80}

                                                                            />
                                                                        </div>
                                                                    )}

                                                                    <input
                                                                        type="file"
                                                                        onChange={(e) => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) {
                                                                                handleImageChange(contentBlockIndex, contentIndex, file)
                                                                            }
                                                                        }}
                                                                        className="hidden"
                                                                        id={`image-${contentBlockIndex}-${contentIndex}`}
                                                                    />

                                                                    <motion.label
                                                                        htmlFor={`image-${contentBlockIndex}-${contentIndex}`}
                                                                        className={` min-w-[185px] text-center py-2 px-4 bg-[#C2724F] rounded cursor-pointer select-none border border-[#F5DEB3] transition-colors duration-75 hover:bg-[#c2724f91] ${editModeActive ? 'block' : 'hidden'}`}
                                                                    >
                                                                        {content.image ? 'Change Image' : 'Upload Image'}
                                                                    </motion.label>

                                                                    <div
                                                                        className="w-full"
                                                                        ref={(el) => {
                                                                            if (el) {
                                                                                if (!textAreaRef.current[contentBlockIndex]) {
                                                                                    textAreaRef.current[contentBlockIndex] = [];
                                                                                }
                                                                                textAreaRef.current[contentBlockIndex][contentIndex] = el;

                                                                            }
                                                                        }}
                                                                    >
                                                                        <pre
                                                                            className={`text-left text-sm md:text-base text-balance ${editModeActive ? 'hidden' : 'block'}`}
                                                                        >
                                                                            {content.text}
                                                                        </pre>
                                                                    </div>

                                                                    <motion.textarea
                                                                        {...register(`content_blocks.${contentBlockIndex}.content.${contentIndex}.text`)}
                                                                        onInput={(e) => {
                                                                            const target = e.target as HTMLTextAreaElement;

                                                                            target.style.height = "auto";
                                                                            target.style.minHeight = "50px";
                                                                            target.style.height = `${target.scrollHeight}px`;
                                                                        }}
                                                                        className={`text-left text-sm md:text-base text-balance text-[#F5DEB3] overflow-hidden py-2 w-full border-2 bg-transparent outline-none resize-none rounded border-white focus:border-orange-400 transition-colors duration-300 ${styles.custom_scroll} ${editModeActive ? 'block' : 'hidden'} focus:caret-white`}
                                                                        style={{

                                                                            maxHeight: "70vh",
                                                                            boxSizing: "border-box"
                                                                        }}
                                                                    />

                                                                    <motion.p
                                                                        initial={{ opacity: 0, height: 0 }}
                                                                        animate={{ opacity: errors.content_blocks?.[contentBlockIndex]?.content?.[contentIndex]?.text?.message ? 30 : 0, height: errors.content_blocks?.[contentBlockIndex]?.content?.[contentIndex]?.text?.message ? 'auto' : '0px' }}
                                                                        transition={{ duration: .3 }}
                                                                        className=" text-orange-300 text-[13px] sm:text-[18px]"
                                                                    >
                                                                        {errors.content_blocks?.[contentBlockIndex]?.content?.[contentIndex]?.text?.message}
                                                                    </motion.p>

                                                                    <motion.button
                                                                        type="button"
                                                                        onClick={() => deleteContentBlock(contentBlockIndex, contentIndex)}
                                                                        className={` min-w-[185px] bg-red-500 px-4 py-2 rounded  transition-colors duration-75 hover:bg-[#c40000] ${editModeActive ? 'block' : 'hidden'}`}
                                                                    >
                                                                        Delete Content Block
                                                                    </motion.button>
                                                                </motion.div>
                                                            )
                                                        })}
                                                    </AnimatePresence>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => addContentBlock(contentBlockIndex)}
                                                    className={`min-w-[185px] bg-blue-400 px-4 py-2 rounded  transition-colors duration-75 hover:bg-[#4576b3] ${editModeActive ? 'block' : 'hidden'}`}
                                                >
                                                    Add Content Block
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => deleteParagraph(contentBlockIndex)}
                                                    className={`min-w-[185px] bg-rose-500 px-4 py-2 rounded  transition-colors duration-75 hover:bg-[#9f1239] ${editModeActive ? 'block' : 'hidden'}`}
                                                >
                                                    Delete contentBlock
                                                </button>
                                            </motion.div>)
                                    }

                                    )}
                                </AnimatePresence>

                                <div className="w-full flex flex-col items-center">
                                    <button
                                        type="button"
                                        onClick={addParagraph}
                                        className={`w-[185px] bg-slate-500 px-4 py-2 rounded ${editModeActive ? 'block' : 'hidden'}`}
                                    >
                                        Add New contentBlock
                                    </button>

                                    <button type="submit" className={`w-[185px] ${editModeActive ? 'block' : 'hidden'} mt-4 px-6 py-2 bg-green-500 rounded`}>
                                        SAVE CHANGES
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                </LazyMotion>
            )}
        </div>
    )
}