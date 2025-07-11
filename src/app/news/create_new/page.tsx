'use client';
import { Header } from "@/app/components/header";
import { Loader } from "@/app/components/load";
import { useState, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import * as Yup from "yup";
import { v4 as uuidv4 } from 'uuid';
import { yupResolver } from "@hookform/resolvers/yup";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/stores/userStore";
import { saveFile } from "@/pages/api/news/saveImagesAPI";
import { K2D } from "next/font/google";
import { ContentBlockFields } from "@/app/components/news/contentBlockFields";

import { FormValues, FileMetadata } from "@/lib/types/news";
import { supabase } from "@/lib/supabase/supabaseClient";
import { IntroductionBlockFields } from "@/app/components/news/IntroductionBlockFields";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

const validationSchema = Yup.object().shape({
    title: Yup.string().required("Title is required").max(50, "The maximum number of characters is 50"),
    description: Yup.string().required("Description is required"),
    content_blocks: Yup.array().of(
        Yup.object().shape({
            id: Yup.string().required(),
            heading: Yup.string().required("Heading is required").max(50, "The maximum number of characters is 50"),
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

export default function CreatePost() {
    const [isLoading, setIsLoading] = useState(true);
    const userData = useUserStore((state) => state.userData);
    const [cookies] = useCookies(['roleToken']);
    const router = useRouter();

    const handleRole = (role: string) => {
        if (role !== 'admin') {
            router.push('/');
        } else {
            setIsLoading(false);
        }

    }

    const { register, control, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: yupResolver(validationSchema),
    });

    const { fields: content_blocks, append, update, replace } = useFieldArray({
        control,
        name: "content_blocks",
        keyName: uuidv4()
    })

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
                                    if (!error) {
                                        router.push('/news');
                                    }
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
                            Authorization: `Bearer ${cookies.roleToken}`,
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

    return (
        <div>
            <Header role={handleRole} />
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
                                <IntroductionBlockFields register={register} errors={errors} />

                                <AnimatePresence mode="popLayout">
                                    <ContentBlockFields register={register} update={update} replace={replace} content_blocks={content_blocks} errors={errors} />
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
        </div>
    )
}