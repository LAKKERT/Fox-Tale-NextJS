'use client'
import { Loader } from "@/app/components/load";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { useCookies } from "react-cookie";
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

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

type FormValues = {
    title: string;
    description: string;
    paragraphs: {
        id: string;
        heading: string;
        cover: File | string | null;
        horizontalPosition: number;
        verticalPosition: number;
        contents: {
            id: string;
            text: string;
            image: File | string | null;
        }[];
    }[];
};

type FileMetadata = {
    name: string;
    extension: string;
    size: number;
};

const validationSchema = Yup.object().shape({
    title: Yup.string().required("Title is required"),
    description: Yup.string().required("Description is required"),
    paragraphs: Yup.array().of(
        Yup.object().shape({
            heading: Yup.string().required("Heading is required"),
            contents: Yup.array().of(
                Yup.object().shape({
                    text: Yup.string().required("Content is required"),
                })
            ),
        })
    ),
});

export function PostDetailComponent({ postID }) {
    const [postData, setPostData] = useState<{ result?: any[] }>();
    const [currentUserRole, setCurrentUserRole] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [editModeActive, setEditModeActive] = useState(false);
    const [deletePost, setDeletePost] = useState(false);
    const [cookies] = useCookies(['auth_token']);
    const router = useRouter();

    const imgRef = useRef<HTMLElement[]>([]);

    const [verticalAlign, setVerticalAlign] = useState<number[]>([]);
    const [horizontalAlign, setHorizontalAlign] = useState<number[]>([]);

    const debouncedUpdate = useRef(
        _.debounce((paragraphIndex, h, v) => {
            setVerticalAlign(prev => {
                const newArr = [...prev];
                newArr[paragraphIndex] = v;
                return newArr;
            });

            setHorizontalAlign(prev => {
                const newArr = [...prev];
                newArr[paragraphIndex] = h;
                return newArr;
            });
        })
    ).current;

    const {
        register, control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
            resolver: yupResolver(validationSchema),
            defaultValues: {
                paragraphs: [],
            }
        });

    const { fields: paragraphs, append, remove, update } = useFieldArray({
        control,
        name: "paragraphs",
        keyName: uuidv4(),
    });

    const fetchPostData = useCallback(async () => {
        try {
            const response = await fetch(`/api/news/fetchPostDataAPI?postID=${postID.id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${cookies ? cookies.auth_token : null}`
                }
            });

            const result = await response.json();

            const formedResult = result.result[0].content.map((content: string[]) => content.filter(item => item !== null))

            if (response.ok) {

                const formattedData = result.result[0].paragraph_heading.map((heading: string, index: number) => ({
                    id: uuidv4(),
                    heading,
                    cover: result.result[0].covers[index],
                    horizontalPosition: Number(result.result[0].covers_horizontal_position[index]),
                    verticalPosition: Number(result.result[0].covers_vertical_position[index]),
                    contents: formedResult[index].map((text: string, contentIndex: number) => ({
                        id: uuidv4(),
                        text,
                        image: result.result[0].images[index]?.[contentIndex] || null
                    }))
                }));

                reset({
                    title: result.result[0].title,
                    description: result.result[0].description,
                    paragraphs: formattedData
                });

                setHorizontalAlign(result.result[0].covers_horizontal_position);
                setVerticalAlign(result.result[0].covers_vertical_position);
                setPostData(result);
                setCurrentUserRole(result.userRole);
                setTimeout(() => {
                    setIsLoading(false);
                }, 300)
            }
        } catch (error) {
            console.error('Error fetching post data:', error);
            setIsLoading(false);
        }
    }, [postID, cookies.auth_token, reset]);

    useEffect(() => {
        fetchPostData();
    }, [fetchPostData]);

    const editMode = () => {
        if (deletePost === true) {
            setDeletePost(false);
        } else {

        }
        const value = editModeActive;

        setEditModeActive(!value);
    }

    const deletePostHandle = () => {
        if (editModeActive === true) {
            setDeletePost(false);
        } else {

            const value = deletePost;

            setDeletePost(!value);
        }
    }

    const addParagraph = () => {
        append({
            id: uuidv4(),
            heading: '',
            horizontalPosition: 50,
            verticalPosition: 50,
            cover: null,
            contents: [{ id: uuidv4(), text: '', image: null }]
        });

        setHorizontalAlign(prev => [...prev, 50]);
        setVerticalAlign(prev => [...prev, 50]);
    };

    const addContentBlock = (paragraphIndex: number) => {
        const paragraph = paragraphs[paragraphIndex];
        update(paragraphIndex, {
            ...paragraph,
            contents: [...paragraph.contents, { id: uuidv4(), text: '', image: null }]
        });
    };

    const deleteContentBlock = (paragraphIndex: number, contentIndex: number) => {
        const updatedContents = paragraphs[paragraphIndex].contents.filter(
            (_, idx) => idx !== contentIndex
        );
        update(paragraphIndex, {
            ...paragraphs[paragraphIndex],
            contents: updatedContents
        });
    };

    const deleteParagraph = (paragraphIndex: number) => {
        remove(paragraphIndex);
    };

    const handleCoverChange = async (paragraphIndex: number, file: File) => {
        const updatedParagraph = {
            ...paragraphs[paragraphIndex],
            cover: file
        };
        update(paragraphIndex, updatedParagraph);
    };

    const handleImageChange = (paragraphIndex: number, contentIndex: number, file: File) => {
        const updatedContents = paragraphs[paragraphIndex].contents.map((content, idx) =>
            idx === contentIndex ? { ...content, image: file } : content
        );

        update(paragraphIndex, {
            ...paragraphs[paragraphIndex],
            contents: updatedContents
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
            const newCovers = data.paragraphs
                .map(p => p.cover)
                .filter(cover => cover instanceof File) as File[];

            const processedCovers = await processFiles(newCovers);
            const coversMetadata = newCovers.map(file => getFileMetadata(file));
            const coversURL = coversMetadata.map(meta =>
                `/uploads/news/${Date.now()}_${meta.name}.${meta.extension}`
            );

            let coverIndex = 0;
            data.paragraphs.forEach(paragraph => {
                if (paragraph.cover instanceof File) {
                    paragraph.cover = coversURL[coverIndex];
                    coverIndex++;
                }
            });

            await saveFile(processedCovers, coversURL);

            const newContentImages = data.paragraphs
                .flatMap(p => p.contents.map(c => c.image))
                .filter(img => img instanceof File) as File[];

            const processedImages = await processFiles(newContentImages);
            const imagesMetadata = newContentImages.map(file => getFileMetadata(file));
            const imagesURL = imagesMetadata.map(meta =>
                `/uploads/news/${Date.now()}_${meta.name}.${meta.extension}`
            );

            let imageIndex = 0;
            data.paragraphs.forEach(paragraph => {
                paragraph.contents.forEach(content => {
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
                fetchPostData();
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

    const handlePositionChange = (paragraphIndex: number, hValue: number, vValue: number) => {
        if (imgRef.current) {
            imgRef.current[paragraphIndex].style.objectPosition = `${hValue}% ${vValue}%`;
        }
    }

    const handleSliderChange = (paragraphIndex: number, isHorizontal: boolean, e) => {
        const value = Number(e.target.value);

        const newH = isHorizontal ? value : horizontalAlign[paragraphIndex];
        const newV = !isHorizontal ? value : verticalAlign[paragraphIndex];

        handlePositionChange(paragraphIndex, newH, newV);
        debouncedUpdate(paragraphIndex, newH, newV)
    }

    console.log(textAreaRef)

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
                                        {postData?.result?.[0].title}
                                    </h1>

                                    <motion.input
                                        {...register('title')}
                                        className={` w-full bg-transparent outline-none border-b-2 border-white focus:border-orange-400 transition-colors duration-300 text-xl md:text-2xl text-center caret-white ${editModeActive ? 'block' : 'hidden'}`}
                                    />

                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: errors.title?.message ? 30 : 0, height: errors.title?.message ? 'auto' : '0px' }}
                                        transition={{ duration: .3 }}
                                        className=" text-orange-300 text-[13px] sm:text-[18px]"
                                    >
                                        {errors.title?.message}
                                    </motion.p>

                                    <p className={`text-base md:text-lg ${editModeActive ? 'hidden' : 'block'}`}>
                                        {postData?.result?.[0].description}
                                    </p>

                                    <motion.textarea
                                        transition={{ duration: .3 }}
                                        {...register('description')}
                                        className={` text-base text-center text-[#F5DEB3] md:text-lg w-full h-[150px] border-2 bg-transparent outline-none resize-none rounded border-white focus:border-orange-400 transition-colors duration-300 ${styles.custom_scroll} ${editModeActive ? 'block' : 'hidden'} caret-white`}
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
                                            {new Date(postData?.result?.[0].add_at).toLocaleString("ru-RU", {
                                                dateStyle: 'short'
                                            })}
                                        </p>
                                        {currentUserRole === "admin" && (
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
                                        className={`${currentUserRole === 'admin' ? 'block' : 'hidden'}`}
                                    >
                                        <p>Do you really want to delete this article?</p>
                                        <div className="flex flex-row justify-center gap-2">
                                            <button type="button" onClick={() => handleDeletePost()} >Yes</button>
                                            <button type="button" onClick={() => setDeletePost(false)}>No</button>
                                        </div>
                                    </motion.div>
                                </motion.div>

                                <AnimatePresence mode="popLayout">
                                    {paragraphs.map((paragraph, paragraphIndex) => {
                                        return (<motion.div
                                            layout={'position'}
                                            key={paragraph.id}
                                            transition={{ duration: .3, type: 'spring', bounce: 0.25 }}
                                            className=" max-w-[1110px] flex flex-col justify-center items-center gap-4"
                                        >
                                            <h2
                                                className={`text-center text-xl wrap text-balance ${editModeActive ? 'hidden' : 'block'}`}
                                            >
                                                {paragraph.heading}
                                            </h2>

                                            <input
                                                {...register(`paragraphs.${paragraphIndex}.heading`)}
                                                className={` w-full bg-transparent outline-none border-b-2 border-white focus:border-orange-400 transition-colors duration-300 text-xl text-center caret-white ${editModeActive ? 'block' : 'hidden'}`}
                                            />

                                            <motion.p
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: errors.paragraphs?.[paragraphIndex]?.heading?.message ? 1 : 0, height: errors.paragraphs?.[paragraphIndex]?.heading?.message ? 'auto' : '0px' }}
                                                transition={{ duration: .3 }}
                                                className={` text-orange-300 text-[13px] sm:text-[18px] ${editModeActive ? 'block' : 'hidden'}`}
                                            >
                                                {errors.paragraphs?.[paragraphIndex]?.heading?.message}
                                            </motion.p>

                                            <motion.p
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: errors.title?.message ? 30 : 0, height: errors.title?.message ? 'auto' : '0px' }}
                                                transition={{ duration: .3 }}
                                                className={` text-orange-300 text-[13px] sm:text-[18px] ${editModeActive ? 'block' : 'hidden'}`}
                                            >
                                                {errors.title?.message}
                                            </motion.p>

                                            {paragraph.cover && (
                                                <motion.div
                                                    layout="position"
                                                    className="w-full h-64 relative mb-4"
                                                >
                                                    <Image
                                                        ref={e => {
                                                            if (e) {
                                                                imgRef.current[paragraphIndex] = e
                                                            }
                                                        }}
                                                        src={typeof paragraph.cover === 'string'
                                                            ? `http://localhost:3000/${paragraph.cover}`
                                                            : URL.createObjectURL(paragraph.cover)}
                                                        alt="cover"
                                                        fill
                                                        className={`transform-gpu rounded object-cover`}
                                                        style={{ objectPosition: `${paragraph.horizontalPosition}% ${paragraph.verticalPosition}%` }}
                                                        sizes="(max-width: 768px) 100vw, 50vw"
                                                        quality={80}
                                                    />
                                                </motion.div>
                                            )}

                                            <motion.div
                                                layout={'position'}
                                                className=" w-full flex flex-col items-center gap-6"
                                            >
                                                <input
                                                    type="file"
                                                    onChange={(e) => handleCoverChange(paragraphIndex, e.target.files?.[0])}
                                                    className="hidden"
                                                    id={`cover-${paragraphIndex}`}
                                                />

                                                <label
                                                    htmlFor={`cover-${paragraphIndex}`}
                                                    className={` min-w-[185px] text-center py-2 mb-3 px-4 bg-[#C2724F] rounded cursor-pointer select-none border border-[#F5DEB3] transition-colors duration-75 hover:bg-[#c2724f91] ${editModeActive ? 'block' : 'hidden'}`}
                                                >
                                                    {paragraph.cover ? 'Change Cover' : 'Upload Cover'}
                                                </label>

                                                <div
                                                    className=" w-full flex flex-col items-center gap-6"
                                                >
                                                    <input type="range" {...register(`paragraphs.${paragraphIndex}.horizontalPosition`, { valueAsNumber: true })} onChange={(e) => handleSliderChange(paragraphIndex, true, e)} min="0" max="100" className={`${styles.custom_input_range} ${editModeActive ? 'block' : 'hidden'}`} />
                                                    <input type="range" {...register(`paragraphs.${paragraphIndex}.verticalPosition`, { valueAsNumber: true })} onChange={(e) => handleSliderChange(paragraphIndex, false, e)} min="0" max="100" className={`${styles.custom_input_range} ${editModeActive ? 'block' : 'hidden'}`} />
                                                </div>
                                            </motion.div>


                                            <div className="w-full relative flex-col flex gap-4">
                                                <AnimatePresence mode="popLayout">
                                                    {paragraph.contents.map((content, contentIndex) => {
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
                                                                        if (e) {
                                                                            handleImageChange(paragraphIndex, contentIndex, e.target.files?.[0])
                                                                        }
                                                                    }}
                                                                    className="hidden"
                                                                    id={`image-${paragraphIndex}-${contentIndex}`}
                                                                />

                                                                <motion.label
                                                                    htmlFor={`image-${paragraphIndex}-${contentIndex}`}
                                                                    className={` min-w-[185px] text-center py-2 px-4 bg-[#C2724F] rounded cursor-pointer select-none border border-[#F5DEB3] transition-colors duration-75 hover:bg-[#c2724f91] ${editModeActive ? 'block' : 'hidden'}`}
                                                                >
                                                                    {content.image ? 'Change Image' : 'Upload Image'}
                                                                </motion.label>

                                                                <p
                                                                    className={`text-left text-sm md:text-base text-balance ${editModeActive ? 'hidden' : 'block'}`}
                                                                >
                                                                    {content.text}
                                                                </p>

                                                                <motion.textarea
                                                                    {...register(`paragraphs.${paragraphIndex}.contents.${contentIndex}.text`)}
                                                                    onInput={(e) => {
                                                                        const target = e.target as HTMLTextAreaElement;
                                                                        target.style.height = `${target.scrollHeight}px`;
                                                                    }}
                                                                    className={`text-left text-sm md:text-base text-balance text-[#F5DEB3] w-full min-h-[150px] border-2 bg-transparent outline-none resize-none rounded border-white focus:border-orange-400 transition-colors duration-300 ${styles.custom_scroll} ${editModeActive ? 'block' : 'hidden'} caret-white`}
                                                                />

                                                                <motion.p
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: errors.paragraphs?.[paragraphIndex]?.contents?.[contentIndex]?.text?.message ? 30 : 0, height: errors.paragraphs?.[paragraphIndex]?.contents?.[contentIndex]?.text?.message ? 'auto' : '0px' }}
                                                                    transition={{ duration: .3 }}
                                                                    className=" text-orange-300 text-[13px] sm:text-[18px]"
                                                                >
                                                                    {errors.paragraphs?.[paragraphIndex]?.contents?.[contentIndex]?.text?.message}
                                                                </motion.p>

                                                                <motion.button
                                                                    type="button"
                                                                    onClick={() => deleteContentBlock(paragraphIndex, contentIndex)}
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
                                                onClick={() => addContentBlock(paragraphIndex)}
                                                className={`min-w-[185px] bg-blue-400 px-4 py-2 rounded  transition-colors duration-75 hover:bg-[#4576b3] ${editModeActive ? 'block' : 'hidden'}`}
                                            >
                                                Add Content Block
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => deleteParagraph(paragraphIndex)}
                                                className={`min-w-[185px] bg-rose-500 px-4 py-2 rounded  transition-colors duration-75 hover:bg-[#9f1239] ${editModeActive ? 'block' : 'hidden'}`}
                                            >
                                                Delete Paragraph
                                            </button>
                                        </motion.div>)
                                    }

                                    )}
                                </AnimatePresence>

                                <button
                                    type="button"
                                    onClick={addParagraph}
                                    className={`bg-slate-500 px-4 py-2 rounded ${editModeActive ? 'block' : 'hidden'}`}
                                >
                                    Add New Paragraph
                                </button>

                                <button type="submit" className={`${editModeActive ? 'block' : 'hidden'} mt-4 px-6 py-2 bg-green-500 rounded`}>
                                    SAVE CHANGES
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                </LazyMotion>
            )}
        </div>
    )
}