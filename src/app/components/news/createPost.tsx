'use client'
import { Loader } from "@/app/components/load";
import { useState, useEffect, useCallback, useRef, ChangeEvent } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import * as Yup from "yup";
import _ from "lodash";
import { v4 as uuidv4 } from 'uuid';
import { yupResolver } from "@hookform/resolvers/yup";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/stores/userStore";
import { saveFile } from "@/pages/api/news/saveImagesAPI";
import { K2D } from "next/font/google";
import styles from "@/app/styles/home/variables.module.scss";
import Image from "next/image";

import { FormValues, FileMetadata } from "@/lib/types/news";

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

export function CreatePostComponent() {
    const [isLoading, setIsLoading] = useState(true);
    const userData = useUserStore((state) => state.userData);
    const [cookies] = useCookies(['auth_token']);
    const router = useRouter();

    const [verticalAlign, setVerticalAlign] = useState<number[]>([]);
    const [horizontalAlign, setHorizontalAlign] = useState<number[]>([]);

    const imgRef = useRef<HTMLElement[]>([]);

    const { register, control, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: yupResolver(validationSchema),
    });

    const { fields: content_blocks, append, update, replace } = useFieldArray({
        control,
        name: "content_blocks",
        keyName: uuidv4()
    })

    useEffect(() => {
        if (userData) {
            if (userData?.role !== 'admin') {
                return router.push("/");
            } else {
                setIsLoading(false)
            }
        }
    }, [userData, router]);

    const addParagraph = () => {

        const newOrder = content_blocks.length > 0 ? content_blocks[content_blocks.length - 1].order_index + 1 : 0;

        append({
            id: uuidv4(),
            heading: '',
            covers: null,
            horizontal_position: 50,
            vertical_position: 50,
            order_index: newOrder,
            content: [{ id: uuidv4(), text: '', image: null, order_index: 0 }]
        });

        setVerticalAlign(prev => [...prev, 50]);
        setHorizontalAlign(prev => [...prev, 50]);
    };

    const addContentBlock = (paragraphIndex: number) => {
        const newContentOrder = content_blocks[paragraphIndex].content.length;

        update(paragraphIndex, {
            ...content_blocks[paragraphIndex],
            content: [...content_blocks[paragraphIndex].content, { id: uuidv4(), text: '', image: null, order_index: newContentOrder }]
        });
    };

    const deleteContentBlock = (paragraphIndex: number, contentIndex: number) => {
        const updatedContents = content_blocks[paragraphIndex].content
            .filter((_, idx) => idx !== contentIndex)
            .map((content, index) => ({ ...content, order_index: index }))

        update(paragraphIndex, {
            ...content_blocks[paragraphIndex],
            content: updatedContents
        });
    };

    const deleteParagraph = (paragraphIndex: number) => {
        const updatedParagraphs = content_blocks
            .filter((_, idx) => idx !== paragraphIndex)
            .map((content, index) => ({ ...content, order_index: index }));

        replace(updatedParagraphs);
    };

    const handleCoverChange = (paragraphIndex: number, file: File) => {
        const updatedParagraph = {
            ...content_blocks[paragraphIndex],
            covers: file
        };
        update(paragraphIndex, updatedParagraph);
    };

    const handleImageChange = (paragraphIndex: number, contentIndex: number, file: File) => {
        const updatedContents = content_blocks[paragraphIndex].content.map((content, idx) =>
            idx === contentIndex ? { ...content, image: file } : content
        )

        update(paragraphIndex, {
            ...content_blocks[paragraphIndex],
            content: updatedContents
        });
    };

    const processFiles = useCallback(async (files: File[]) => {
        return Promise.all(
            files.map((file: File) =>
                new Promise((resolve, reject) => {
                    if (!file) resolve(null);
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                })
            )
        );
    }, []);

    const getFileMetadata = useCallback((files: File[]): FileMetadata[] => {
        return files.map((file: File) => {
            const fileName = file?.name || '';
            const lastDotIndex = fileName.lastIndexOf(".");
            return {
                name: lastDotIndex > -1 ? fileName.substring(0, lastDotIndex) : fileName,
                extension: lastDotIndex > -1 ? fileName.substring(lastDotIndex + 1) : '',
                size: file?.size || 0
            };
        });
    }, []);

    const onSubmit = async (data: FormValues) => {
        if (userData) {
            try {
                const covers = await processFiles(
                    data.content_blocks
                        .map(p => p.covers)
                        .filter((item): item is File => item instanceof File)
                ) as string[];
                const coversMetadata = getFileMetadata(
                    data.content_blocks
                        .map(p => p.covers)
                        .filter((item): item is File => item instanceof File)
                );
                const coversURL = coversMetadata.map(meta =>
                    meta.size > 0 ? `/uploads/news/${Date.now()}_${meta.name}.${meta.extension}` : null
                );
                await saveFile(covers, coversURL.filter((url): url is string => url !== '' && url !== null));

                data.content_blocks.forEach((content, index) => {
                    if (content.covers) {
                        content.covers = coversURL[index];
                        content.horizontal_position = horizontalAlign[index];
                        content.vertical_position = verticalAlign[index];
                    }
                });

                const allContentImages = data.content_blocks
                    .flatMap(p => p.content.map(c => c.image))
                    .filter(img => img instanceof File) as File[];
                const images = await processFiles(allContentImages) as string[];
                const imagesMetadata = getFileMetadata(allContentImages);
                const imagesURL = imagesMetadata.map(meta =>
                    meta.size > 0 ? `/uploads/news/${Date.now()}_${meta.name}.${meta.extension}` : null
                );

                await saveFile(images.flat(), imagesURL.flat().filter((url): url is string => url !== null));

                let imageIndex = 0;
                data.content_blocks.forEach(content => {
                    content.content.forEach(content => {
                        if (content.image) {
                            content.image = imagesURL[imageIndex];
                            imageIndex++;
                        }
                    });
                });

                const payload = {
                    data,
                    userID: userData.id,
                };

                const response = await fetch('/api/news/addNewsAPI', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${cookies.auth_token}`,
                    },
                    body: JSON.stringify(payload),
                });

                if (response.ok) {
                    router.push('/');
                } else {
                    console.error('Error saving post');
                }
            } catch (error) {
                console.error('Submission error:', error);
            }
        }
    };

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
            })
        }, 300)
    ).current;

    const handlePositionChange = (paragraphIndex: number, hValue: number, vValue: number) => {
        if (imgRef.current) {
            imgRef.current[paragraphIndex].style.objectPosition = `${hValue}% ${vValue}%`;
        }
    }

    const handleSliderChange = (paragraphIndex: number, isHorizontal: boolean, e: ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);

        const newH = isHorizontal ? value : horizontalAlign[paragraphIndex];
        const newV = !isHorizontal ? value : verticalAlign[paragraphIndex];

        handlePositionChange(paragraphIndex, newH, newV);
        debouncedUpdate(paragraphIndex, newH, newV);
    };

    return (
        <div className={`max-w-[768px] xl:max-w-[1110px] flex flex-col items-center gap-0 lg:max-w-8xl mx-auto mt-[100px] ${MainFont.className} text-[#F5DEB3] caret-transparent pt-4 pb-8`}>
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
                <div className="w-full">
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
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="min-h-[260px] max-w-[1110px] flex flex-col justify-evenly gap-3 text-center text-balance"
                            >
                                <motion.input
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20, height: 0 }}
                                    transition={{ duration: .3 }}
                                    placeholder="TITLE"
                                    {...register('title')}
                                    className={`w-full bg-transparent outline-none border-b-2 border-white focus:border-orange-400 transition-colors duration-300 text-xl md:text-2xl text-center focus:caret-white`}
                                />

                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: errors.title?.message ? 30 : 0, height: errors.title?.message ? 'auto' : '0px' }}
                                    transition={{ duration: .3 }}
                                    className="text-orange-300 text-[13px] sm:text-[18px]"
                                >
                                    {errors.title?.message}
                                </motion.p>

                                <motion.textarea
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20, height: 0 }}
                                    transition={{ duration: .3 }}
                                    placeholder="DESCRIPTION"
                                    {...register('description')}
                                    className={`text-base text-center md:text-lg w-full h-[150px] border-2 bg-transparent outline-none resize-none rounded border-white focus:caret-white focus:border-orange-400 transition-colors duration-300 ${styles.custom_scroll}`}
                                />

                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: errors.description?.message ? 30 : 0, height: errors.description?.message ? 'auto' : '0px' }}
                                    transition={{ duration: .3 }}
                                    className="text-orange-300 text-[13px] sm:text-[18px]"
                                >
                                    {errors.description?.message}
                                </motion.p>
                            </motion.div>


                            <AnimatePresence mode="popLayout">
                                {content_blocks.map((content, paragraphIndex) => {
                                    return (
                                        <motion.div
                                            layout
                                            key={content.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: .3, type: 'spring', bounce: 0.25 }}
                                            className="max-w-[1110px] flex flex-col justify-center items-center gap-4 p-3 rounded border-2 border-[#464544]"
                                        >
                                            <motion.input
                                                layout={'position'}
                                                placeholder={`Heading ${paragraphIndex + 1}`}
                                                {...register(`content_blocks.${paragraphIndex}.heading`)}
                                                className={`w-full h-[34px] bg-transparent outline-none border-b-2 border-white focus:border-orange-400 text-xl md:text-2xl text-center focus:caret-white`}
                                                onChange={(e) => {
                                                    update(paragraphIndex, {
                                                        ...content_blocks[paragraphIndex],
                                                        heading: e.target.value
                                                    })
                                                }}
                                            />

                                            <motion.p
                                                layout={'position'}
                                                className="text-orange-300 text-[13px] sm:text-[18px]"
                                            >
                                                {errors.content_blocks?.[paragraphIndex]?.heading?.message}
                                            </motion.p>

                                            {content.covers && (
                                                <motion.div
                                                    layout={'position'}
                                                    className="w-full h-64 relative mb-4"
                                                >
                                                    <Image
                                                        ref={e => {
                                                            if (e) {
                                                                imgRef.current[paragraphIndex] = e
                                                            }
                                                        }}
                                                        src={typeof content.covers === 'string'
                                                            ? `http://localhost:3000/${content.covers}`
                                                            : URL.createObjectURL(content.covers)}
                                                        alt="covers"
                                                        fill
                                                        className={`transform-gpu rounded object-cover`}
                                                        // style={{ objectPosition: `${content.horizontalPosition}% ${content.verticalPosition}%` }}
                                                        style={{ objectPosition: `${horizontalAlign[paragraphIndex]}% ${verticalAlign[paragraphIndex]}%` }}
                                                        sizes="(max-width: 768px) 100vw, 50vw"
                                                        quality={80}
                                                    />
                                                </motion.div>
                                            )}

                                            <motion.div
                                                layout={'position'}
                                                className={`w-full flex flex-col items-center ${content_blocks[paragraphIndex]?.covers ? "gap-6" : ""}  `}
                                            >

                                                <input
                                                    type="file"
                                                    onChange={(e) => {
                                                        if (e.target.files) {
                                                            handleCoverChange(paragraphIndex, e.target.files[0])
                                                        }
                                                    }}
                                                    className="hidden"
                                                    id={`covers-${paragraphIndex}`}
                                                />

                                                <motion.label
                                                    layout={'position'}
                                                    htmlFor={`covers-${paragraphIndex}`}
                                                    className={`min-w-[185px] text-center py-2  bg-[#C2724F] rounded cursor-pointer select-none border border-[#F5DEB3] transition-colors duration-75 hover:bg-[#c2724f91]`}
                                                >
                                                    {content.covers ? 'Change Cover' : 'Upload Cover'}
                                                </motion.label>

                                                <div
                                                    className={`w-full flex flex-col items-center gap-6 ${content_blocks[paragraphIndex].covers !== null ? 'block' : 'hidden'}`}
                                                >
                                                    <input type="range" {...register(`content_blocks.${paragraphIndex}.horizontal_position`, { valueAsNumber: true })} onChange={(e) => handleSliderChange(paragraphIndex, true, e)} min="0" max="100" className={`${styles.custom_input_range} `} />
                                                    <input type="range" {...register(`content_blocks.${paragraphIndex}.vertical_position`, { valueAsNumber: true })} onChange={(e) => handleSliderChange(paragraphIndex, false, e)} min="0" max="100" className={`${styles.custom_input_range} `} />
                                                </div>
                                            </motion.div>


                                            <div className="w-full relative flex-col flex gap-4">

                                                <AnimatePresence mode="popLayout">
                                                    {content.content.map((content, contentIndex) => {
                                                        return (
                                                            <motion.div
                                                                key={content.id}
                                                                layout
                                                                initial={{ opacity: 0, scale: 0.8 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0, scale: 0.8 }}
                                                                transition={{ duration: .3, type: 'spring', bounce: 0.25 }}
                                                                className="w-full flex flex-col justify-center items-center gap-2 p-3 rounded border-2 border-[#252525]"
                                                            >
                                                                {content.image && (
                                                                    <Image
                                                                        src={typeof content.image === 'string'
                                                                            ? `http://localhost:3000/${content.image}`
                                                                            : URL.createObjectURL(content.image)}
                                                                        alt="Content"
                                                                        width={1110}
                                                                        height={400}
                                                                        className="rounded"
                                                                    />
                                                                )}

                                                                <input
                                                                    type="file"
                                                                    onChange={(e) => {
                                                                        if (e.target.files) {
                                                                            handleImageChange(paragraphIndex, contentIndex, e.target.files?.[0])
                                                                        }
                                                                    }}
                                                                    className="hidden"
                                                                    id={`image-${paragraphIndex}-${contentIndex}`}
                                                                />
                                                                <motion.label
                                                                    htmlFor={`image-${paragraphIndex}-${contentIndex}`}
                                                                    className={`min-w-[185px] text-center py-2  bg-[#C2724F] rounded cursor-pointer select-none border border-[#F5DEB3] transition-colors  hover:bg-[#c2724f91]  `}
                                                                >
                                                                    {content.image ? 'Change Image' : 'Upload Image'}
                                                                </motion.label>

                                                                <motion.textarea
                                                                    placeholder={`Content ${contentIndex + 1}`}
                                                                    {...register(`content_blocks.${paragraphIndex}.content.${contentIndex}.text`)}

                                                                    className={`text-left text-sm md:text-base text-balance text-white w-full h-[150px] border-2 bg-transparent outline-none resize-none rounded border-white focus:caret-white focus:border-orange-400 transition-colors duration-300 ${styles.custom_scroll}`}
                                                                />

                                                                <motion.p
                                                                    className="text-orange-300 text-[13px] sm:text-[18px]"
                                                                >
                                                                    {errors.content_blocks?.[paragraphIndex]?.content?.[contentIndex]?.text?.message}
                                                                </motion.p>

                                                                <motion.button
                                                                    type="button"
                                                                    onClick={() => deleteContentBlock(paragraphIndex, contentIndex)}
                                                                    className={`min-w-[185px] bg-red-500  py-2 rounded  transition-colors duration-75 hover:bg-[#c40000]  `}
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
                                                className={`min-w-[185px] bg-blue-400 py-2 rounded   hover:bg-[#4576b3]`}
                                            >
                                                Add Content Block
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => deleteParagraph(paragraphIndex)}
                                                className={`min-w-[185px] bg-rose-500 py-2 rounded  hover:bg-[#9f1239]`}
                                            >
                                                Delete Paragraph
                                            </button>
                                        </motion.div>

                                    )
                                })}
                            </AnimatePresence>


                            <div className="w-full flex flex-col items-center">
                                <button
                                    type="button"
                                    onClick={addParagraph}
                                    className={`w-[185px] bg-slate-500  py-2 rounded`}
                                >
                                    Add New Paragraph
                                </button>

                                <button type="submit" className={`w-[185px] mt-4 px-6 py-2 bg-green-500 rounded`}>
                                    SUBMIT
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    )
}