'use client';

import { Header } from "@/app/components/header";
import { Footer } from "@/app/components/footer";
import { Loader } from "@/app/components/load";
import { useState, useEffect, useCallback } from "react";
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
import { useRouter, useParams } from "next/navigation";

import { ContentBlock, NewsStructure, FileMetadata, FormValues } from "@/lib/types/news";
import { supabase } from "@/lib/supabase/supabaseClient";
import { IntroductionBlock } from "@/app/components/news/introductionBlock";
import { ContentBlocks } from "@/app/components/news/contentBlock";

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

export default function PostDetail() {
    const params = useParams();
    const [postData, setPostData] = useState<NewsStructure>();
    const userData = useUserStore((state) => state.userData);
    const [isLoading, setIsLoading] = useState(true);
    const [editModeActive, setEditModeActive] = useState(false);
    const [deletePost, setDeletePost] = useState(false);
    const [cookies] = useCookies(['roleToken']);
    const router = useRouter();

    const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
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

    const [userRole, setUserRole] = useState<string>();

    const handleRole = (role: string) => {
        setUserRole(role)
    }

    useEffect(() => {
        const fetchPostData = async () => {
            try {
                if (!params) return;

                if (process.env.NEXT_PUBLIC_ENV === 'production') {
                    const { data, error } = await supabase
                        .from('news')
                        .select(`title, description, add_at, author,
                                content_blocks (
                                    id, heading, covers, news_id, order_index, vertical_position, horizontal_position,
                                    content (
                                            id, content, content_block_id, order_index, image
                                    )
                                )
                                `)
                        .eq('id', params.id)
                        .single();

                    if (error) console.error('error occured', error)

                    if (data) {
                        if (data.content_blocks) {
                            data.content_blocks.sort((a, b) => a.order_index - b.order_index);
                            data.content_blocks.forEach(content_block => {
                                if (content_block.content) {
                                    content_block.content.sort((a, b) => a.order_index - b.order_index);
                                }
                            });
                        }

                        setPostData(data);

                        setTimeout(() => {
                            setIsLoading(false);
                        }, 300);
                    }
                } else {
                    const response = await fetch(`/api/news/fetchPostDataAPI?postID=${params?.id}`, {
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
                                content: content.content || "",
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
                }
            } catch (error) {
                console.error('Error fetching post data:', error);
                setIsLoading(false);
            }
        }
        fetchPostData();
    }, [userData, cookies, router, params, reset]);


    useEffect(() => {
        if (!editModeActive && postData) {
            reset({
                title: postData.title || "",
                description: postData.description || "",
                content_blocks: postData.content_blocks || []
            });
        }
    }, [editModeActive, postData, reset]);

    const editModeChange = useCallback((editMode: boolean, deleteMode: boolean) => {
        setEditModeActive(editMode);
        setDeletePost(deleteMode);
    },
        []
    )

    const addParagraph = () => {
        const newOrder = content_blocks.length > 0 ? content_blocks[content_blocks.length - 1].order_index + 1 : 0;

        append({
            id: uuidv4(),
            heading: '',
            horizontal_position: 50,
            vertical_position: 50,
            covers: null,
            order_index: newOrder,
            content: [{ id: uuidv4(), content: '', image: null, order_index: 0 }]
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

    const onSubmit = async (formData: FormValues) => {
        try {
            const newCovers = formData.content_blocks
                .map(p => p.covers)
                .filter(covers => covers instanceof File) as File[];

            const processedCovers = await processFiles(newCovers) as string[];
            const coversMetadata = newCovers.map(file => getFileMetadata(file));
            const coversURL = coversMetadata.map(meta =>
                `/uploads/news/${Date.now()}_${meta.name}.${meta.extension}`
            );

            let coverIndex = 0;
            formData.content_blocks.forEach(contentBlock => {
                if (contentBlock.covers instanceof File) {
                    contentBlock.covers = coversURL[coverIndex];
                    coverIndex++;
                }
            });

            await saveFile(processedCovers, coversURL);

            const newContentImages = formData.content_blocks
                .flatMap(p => p.content.map(c => c.image))
                .filter(img => img instanceof File) as File[];

            const processedImages = await processFiles(newContentImages) as string[];
            const imagesMetadata = newContentImages.map(file => getFileMetadata(file));
            const imagesURL = imagesMetadata.map(meta =>
                `/uploads/news/${Date.now()}_${meta.name}.${meta.extension}`
            );

            let imageIndex = 0;
            formData.content_blocks.forEach(contentBlock => {
                contentBlock.content.forEach(content => {
                    if (content.image instanceof File) {
                        content.image = imagesURL[imageIndex];
                        imageIndex++;
                    }
                });
            });

            await saveFile(processedImages, imagesURL);

            if (process.env.NEXT_PUBLIC_ENV === 'production') {
                const { error } = await supabase
                    .from('news')
                    .update({
                        title: formData.title,
                        description: formData.description
                    })
                    .eq('id', params?.id)
                if (error) console.error(error)

                const { error: removeContentBlockError } = await supabase
                    .from('content_blocks')
                    .delete()
                    .eq('news_id', params?.id)
                if (removeContentBlockError) console.error(removeContentBlockError)

                formData.content_blocks.map(async (item) => {
                    const { data: newsContentBlockData, error } = await supabase
                        .from('content_blocks')
                        .insert({
                            heading: item.heading,
                            covers: item.covers,
                            news_id: params?.id,
                            order_index: item.order_index,
                            vertical_position: item.vertical_position,
                            horizontal_position: item.horizontal_position
                        })
                        .select('id')
                        .single();
                    if (error) console.error('content block error', error)

                    if (newsContentBlockData) {
                        item.content.map(async (item) => {
                            const { error } = await supabase
                                .from('content')
                                .insert({
                                    content: item.content,
                                    order_index: item.order_index,
                                    image: item.image,
                                    content_block_id: newsContentBlockData?.id
                                })
                            if (error) {
                                console.error(error);
                            } else {
                                window.location.reload();
                            }
                        })
                    }
                })

            } else {
                const payload = {
                    formData,
                    postID: params?.id,
                };

                const response = await fetch('/api/news/addNewsAPI', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${cookies.roleToken}`
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    setEditModeActive(false);
                    window.location.reload();
                } else {
                    console.error('Error adding new post:');
                }
            }

        } catch (error) {
            console.error('Error updating post:', error);
        }
    };

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
        <div className="w-full min-h-[calc(100vh-100px)] mt-[100px] bg-black object-cover bg-cover bg-center bg-no-repeat overflow-hidden caret-transparent">
            <Header role={handleRole} />

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
                                    <IntroductionBlock register={register} postData={postData} editModeActive={editModeActive} deletePost={deletePost} errors={errors} userRole={userRole} editModeChange={editModeChange} params={params} />

                                    <AnimatePresence mode="wait">
                                        <ContentBlocks register={register} update={update} replace={replace} errors={errors} editModeActive={editModeActive} content_blocks={content_blocks} />
                                    </AnimatePresence>

                                    <div className="w-full flex flex-col items-center">
                                        <button
                                            type="button"
                                            onClick={addParagraph}
                                            className={`w-[185px] bg-slate-500 px-4 py-2 rounded ${editModeActive ? 'block' : 'hidden'}`}
                                        >
                                            Add Content Block
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
            <Footer />
        </div>
    )
}