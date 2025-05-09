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
import { supabase } from "@/lib/supabase/supabaseClient";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

const validationSchema = Yup.object().shape({
    title: Yup.string().required("Title is required"),
    description: Yup.string().required("Description is required"),
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
                    content: Yup.string().required("Content is required"),
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
            content: [{ id: uuidv4(), content: '', image: null, order_index: 0 }]
        });
    };

    const addContentBlock = (contentBlockIndex: number) => {
        const newContentOrder = content_blocks[contentBlockIndex].content.length;

        update(contentBlockIndex, {
            ...content_blocks[contentBlockIndex],
            content: [...content_blocks[contentBlockIndex].content, { id: uuidv4(), content: '', image: null, order_index: newContentOrder }]
        });
    };

    const deleteContentBlock = (contentBlockIndex: number, contentIndex: number) => {
        const updatedContents = content_blocks[contentBlockIndex].content
            .filter((_, idx) => idx !== contentIndex)
            .map((content, index) => ({ ...content, order_index: index }))

        update(contentBlockIndex, {
            ...content_blocks[contentBlockIndex],
            content: updatedContents
        });
    };

    const deleteParagraph = (contentBlockIndex: number) => {
        const updatedParagraphs = content_blocks
            .filter((_, idx) => idx !== contentBlockIndex)
            .map((content, index) => ({ ...content, order_index: index }));

        replace(updatedParagraphs);
    };

    const handleCoverChange = (contentBlockIndex: number, file: File) => {
        const updatedParagraph = {
            ...content_blocks[contentBlockIndex],
            covers: file
        };
        update(contentBlockIndex, updatedParagraph);
    };

    const handleImageChange = (contentBlockIndex: number, contentIndex: number, file: File) => {
        const updatedContents = content_blocks[contentBlockIndex].content.map((content, idx) =>
            idx === contentIndex ? { ...content, image: file } : content
        )

        update(contentBlockIndex, {
            ...content_blocks[contentBlockIndex],
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

    const onSubmit = async (formData: FormValues) => {
        if (userData) {
            try {
                const covers = await processFiles(
                    formData.content_blocks
                        .map(p => p.covers)
                        .filter((item): item is File => item instanceof File)
                ) as string[];
                const coversMetadata = getFileMetadata(
                    formData.content_blocks
                        .map(p => p.covers)
                        .filter((item): item is File => item instanceof File)
                );
                const coversURL = coversMetadata.map(meta =>
                    meta.size > 0 ? `/uploads/news/${Date.now()}_${meta.name}.${meta.extension}` : null
                );
                await saveFile(covers, coversURL.filter((url): url is string => url !== '' && url !== null));

                formData.content_blocks.forEach((content, index) => {
                    if (content.covers) {
                        content.covers = coversURL[index];
                    }
                });

                const allContentImages = formData.content_blocks
                    .flatMap(p => p.content.map(c => c.image))
                    .filter(img => img instanceof File) as File[];
                const images = await processFiles(allContentImages) as string[];
                const imagesMetadata = getFileMetadata(allContentImages);
                const imagesURL = imagesMetadata.map(meta =>
                    meta.size > 0 ? `/uploads/news/${Date.now()}_${meta.name}.${meta.extension}` : null
                );

                await saveFile(images.flat(), imagesURL.flat().filter((url): url is string => url !== null));

                let imageIndex = 0;
                formData.content_blocks.forEach(content => {
                    content.content.forEach(content => {
                        if (content.image) {
                            content.image = imagesURL[imageIndex];
                            imageIndex++;
                        }
                    });
                });

                if (process.env.NEXT_PUBLIC_ENV === 'production') {
                    const { data, error } = await supabase
                        .from('news')
                        .insert({
                            title: formData.title,
                            description: formData.description,
                            author: userData.id,
                            add_at: new Date().toISOString()
                        })
                        .select('id')
                        .single();

                    if (error) {
                        console.error('Insert error:', error);
                        return;
                    }

                    if (data) {
                        const modifiedFormData = formData.content_blocks.map((item) => {
                            return {
                                ...item,
                                news_id: data.id
                            }
                        })

                        modifiedFormData.map(async (item) => {
                            const { data: newsContentBlockData, error } = await supabase
                                .from('content_blocks')
                                .insert({
                                    heading: item.heading,
                                    covers: item.covers,
                                    news_id: data.id,
                                    order_index: item.order_index,
                                    vertical_position: item.vertical_position,
                                    horizontal_position: item.horizontal_position
                                })
                                .select('id')
                                .single();
                            if (error) console.error(error)

                            if (data) {
                                item.content.map(async (item) => {
                                    const { error } = await supabase
                                        .from('content')
                                        .insert({
                                            content: item.content,
                                            order_index: item.order_index,
                                            image: item.image,
                                            content_block_id: newsContentBlockData?.id
                                        })
                                    if (error) console.error(error);
                                })
                            }
                        })
                    }
                } else {
                    const payload = {
                        formData,
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
                }
            } catch (error) {
                console.error('Submission error:', error);
            }
        }
    };

    const debouncedUpdate = useRef(
        _.debounce((block, contentBlockIndex, h, v) => {
            update(contentBlockIndex, {
                ...block[contentBlockIndex],
                vertical_position: v,
                horizontal_position: h,
            })
        }, 300)
    ).current;

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
                                {content_blocks.map((contentBlock, contentBlockIndex) => {
                                    return (
                                        <motion.div
                                            layout
                                            key={contentBlock.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: .3, type: 'spring', bounce: 0.25 }}
                                            className="max-w-[1110px] flex flex-col justify-center items-center gap-4 p-3 rounded border-2 border-[#464544]"
                                        >
                                            <motion.input
                                                layout={'position'}
                                                placeholder={`Heading ${contentBlockIndex + 1}`}
                                                {...register(`content_blocks.${contentBlockIndex}.heading`)}
                                                className={`w-full h-[34px] bg-transparent outline-none border-b-2 border-white focus:border-orange-400 text-xl md:text-2xl text-center focus:caret-white`}
                                                onChange={(e) => {
                                                    update(contentBlockIndex, {
                                                        ...content_blocks[contentBlockIndex],
                                                        heading: e.target.value
                                                    })
                                                }}
                                            />

                                            <motion.p
                                                layout={'position'}
                                                className="text-orange-300 text-[13px] sm:text-[18px]"
                                            >
                                                {errors.content_blocks?.[contentBlockIndex]?.heading?.message}
                                            </motion.p>

                                            {contentBlock.covers && (
                                                <motion.div
                                                    layout={'position'}
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
                                                        style={{ objectPosition: `${contentBlock.horizontal_position}}% ${contentBlock.vertical_position}%` }}
                                                        sizes="(max-width: 768px) 100vw, 50vw"
                                                        quality={80}
                                                    />
                                                </motion.div>
                                            )}

                                            <motion.div
                                                layout={'position'}
                                                className={`w-full flex flex-col items-center ${content_blocks[contentBlockIndex]?.covers ? "gap-6" : ""}  `}
                                            >

                                                <input
                                                    type="file"
                                                    onChange={(e) => {
                                                        if (e.target.files) {
                                                            handleCoverChange(contentBlockIndex, e.target.files[0])
                                                        }
                                                    }}
                                                    className="hidden"
                                                    id={`covers-${contentBlockIndex}`}
                                                />

                                                <motion.label
                                                    layout={'position'}
                                                    htmlFor={`covers-${contentBlockIndex}`}
                                                    className={`min-w-[185px] text-center py-2  bg-[#C2724F] rounded cursor-pointer select-none border border-[#F5DEB3] transition-colors duration-75 hover:bg-[#c2724f91]`}
                                                >
                                                    {contentBlock.covers ? 'Change Cover' : 'Upload Cover'}
                                                </motion.label>

                                                <div
                                                    className={`w-full flex flex-col items-center gap-6 ${content_blocks[contentBlockIndex].covers !== null ? 'block' : 'hidden'}`}
                                                >
                                                    <input type="range" {...register(`content_blocks.${contentBlockIndex}.horizontal_position`, { valueAsNumber: true })} onChange={(e) => handleSliderChange(contentBlockIndex, true, e)} min="0" max="100" className={`${styles.custom_input_range} `} />
                                                    <input type="range" {...register(`content_blocks.${contentBlockIndex}.vertical_position`, { valueAsNumber: true })} onChange={(e) => handleSliderChange(contentBlockIndex, false, e)} min="0" max="100" className={`${styles.custom_input_range} `} />
                                                </div>
                                            </motion.div>


                                            <div className="w-full relative flex-col flex gap-4">

                                                <AnimatePresence mode="popLayout">
                                                    {contentBlock.content.map((content, contentIndex) => {
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
                                                                            handleImageChange(contentBlockIndex, contentIndex, e.target.files?.[0])
                                                                        }
                                                                    }}
                                                                    className="hidden"
                                                                    id={`image-${contentBlockIndex}-${contentIndex}`}
                                                                />
                                                                <motion.label
                                                                    htmlFor={`image-${contentBlockIndex}-${contentIndex}`}
                                                                    className={`min-w-[185px] text-center py-2  bg-[#C2724F] rounded cursor-pointer select-none border border-[#F5DEB3] transition-colors  hover:bg-[#c2724f91]  `}
                                                                >
                                                                    {content.image ? 'Change Image' : 'Upload Image'}
                                                                </motion.label>

                                                                <motion.textarea
                                                                    placeholder={`Content ${contentIndex + 1}`}
                                                                    {...register(`content_blocks.${contentBlockIndex}.content.${contentIndex}.content`)}

                                                                    className={`text-left text-sm md:text-base text-balance text-white w-full h-[150px] border-2 bg-transparent outline-none resize-none rounded border-white focus:caret-white focus:border-orange-400 transition-colors duration-300 ${styles.custom_scroll}`}
                                                                />

                                                                <motion.p
                                                                    className="text-orange-300 text-[13px] sm:text-[18px]"
                                                                >
                                                                    {errors.content_blocks?.[contentBlockIndex]?.content?.[contentIndex]?.content?.message}
                                                                </motion.p>

                                                                <motion.button
                                                                    type="button"
                                                                    onClick={() => deleteContentBlock(contentBlockIndex, contentIndex)}
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
                                                onClick={() => addContentBlock(contentBlockIndex)}
                                                className={`min-w-[185px] bg-blue-400 py-2 rounded   hover:bg-[#4576b3]`}
                                            >
                                                Add Content Block
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => deleteParagraph(contentBlockIndex)}
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