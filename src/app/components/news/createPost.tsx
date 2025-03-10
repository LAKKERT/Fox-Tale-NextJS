'use client'
import { Loader } from "@/app/components/load";
import { useState, useEffect, useCallback, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import * as Yup from "yup";
import { v4 as uuidv4 } from 'uuid';
import { yupResolver } from "@hookform/resolvers/yup";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useTime } from "framer-motion";
import { useUserStore } from "@/stores/userStore";
import _ from "lodash"
import { saveFile } from "@/pages/api/news/saveImagesAPI";
import { K2D } from "next/font/google";
import styles from "@/app/styles/home/variables.module.scss";
import Image from "next/image";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

type FormValues = {
    title: string;
    description: string;
    paragraphs: {
        id: string,
        heading: string;
        cover: File | Blob | string | null;
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

export function CreatePostComponent() {
    const [isLoading, setIsLoading] = useState(true);
    const [userID, setUserID] = useState('');
    const userData = useUserStore((state) => state.userData);
    const [cookies] = useCookies(['auth_token']);
    const router = useRouter();

    const imgRef = useRef<HTMLElement[]>([]);

    const { register, control, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: yupResolver(validationSchema),
    });

    const { fields: paragraphs, append, remove, update } = useFieldArray({
        control,
        name: "paragraphs",
        keyName: uuidv4(),
    })

    useEffect(() => {

        if (!cookies) {
            return router.push('/login');
        }

        const timeout = setTimeout(() => {
            if (!userData || userData.role !== 'admin') {
                router.push('/'); 
            }
        }, 5000);

        setIsLoading(false);

        if (userData) {
            clearTimeout(timeout);
        }

        return () => clearTimeout(timeout);
    }, [userData, router]);

    const addParagraph = () => {
        append({
            id: uuidv4(),
            heading: '',
            cover: null,
            horizontalPosition: 50,
            verticalPosition: 50,
            contents: [{ id: uuidv4(), text: '', image: null }]
        });
    };

    const addContentBlock = (paragraphIndex: number) => {
        const paragraph = paragraphs[paragraphIndex];
        update(paragraphIndex, {
            ...paragraph,
            contents: [...paragraph.contents, { id: uuidv4(), text: '', image: null }]
        });
    };

    const deleteContentBlock = (paragraphIndex: number, contentIndex: number) => {

        const updatedContents = paragraphs[paragraphIndex].contents.filter((_, idx) => {
            return idx !== contentIndex
        });

        update(paragraphIndex, {
            ...paragraphs[paragraphIndex],
            contents: updatedContents
        });
    };

    const deleteParagraph = (paragraphIndex: number) => {
        remove(paragraphIndex);
    };

    const handleCoverChange = (paragraphIndex: number, file: File) => {
        const updatedParagraph = {
            ...paragraphs[paragraphIndex],
            cover: file
        };
        update(paragraphIndex, updatedParagraph);
    };

    const handleImageChange = (paragraphIndex: number, contentIndex: number, file: File) => {
        const updatedContents = paragraphs[paragraphIndex].contents.map((content, idx) =>
            idx === contentIndex ? { ...content, image: file } : content
        )

        update(paragraphIndex, {
            ...paragraphs[paragraphIndex],
            contents: updatedContents
        });
    };

    const processFiles = useCallback(async (files: File[]) => {
        return Promise.all(
            files.map(file =>
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
        return files.map(file => {
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
                    data.paragraphs.map(p => p.cover).filter(Boolean)
                );
                const coversMetadata = getFileMetadata(
                    data.paragraphs.map(p => p.cover).filter(Boolean)
                );
                const coversURL = coversMetadata.map(meta =>
                    meta.size > 0 ? `/uploads/news/${Date.now()}_${meta.name}.${meta.extension}` : null
                );
                await saveFile(covers, coversURL.filter((url): url is string => url !== '' && url !== null));
    
                data.paragraphs.forEach((paragraph, index) => {
                    if (paragraph.cover) {
                        paragraph.cover = coversURL[index];
                    }
                });
    
                const allContentImages = data.paragraphs
                    .flatMap(p => p.contents.map(c => c.image))
                    .filter(img => img instanceof File) as File[];
                const images = await processFiles(allContentImages);
                const imagesMetadata = getFileMetadata(allContentImages);
                const imagesURL = imagesMetadata.map(meta =>
                    meta.size > 0 ? `/uploads/news/${Date.now()}_${meta.name}.${meta.extension}` : null
                );
                await saveFile(images.flat(), imagesURL.flat());
    
                let imageIndex = 0;
                data.paragraphs.forEach(paragraph => {
                    paragraph.contents.forEach(content => {
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
                    console.log('Error saving post');
                }
            } catch (error) {
                console.error('Submission error:', error);
                alert('Error submitting form');
            }
        }
    };

    const handlePositionChange = (paragraphIndex: number, hValue: number, vValue: number) => {
        if (imgRef.current) {
            imgRef.current[paragraphIndex].style.objectPosition = `${hValue}% ${vValue}%`;
        }
    }

    const handleSliderChange = (paragraphIndex: number, isHorizontal: boolean, e) => {
        const value = Number(e.target.value);
        
        const currentH = paragraphs[paragraphIndex].horizontalPosition;
        const currentV = paragraphs[paragraphIndex].verticalPosition;
      
        const newH = isHorizontal ? value : currentH;
        const newV = !isHorizontal ? value : currentV;
      
        handlePositionChange(paragraphIndex, newH, newV);
        
        update(paragraphIndex, {
          ...paragraphs[paragraphIndex],
          horizontalPosition: newH,
          verticalPosition: newV
        });
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
                                    className={`w-full bg-transparent outline-none border-b-2 border-white focus:border-orange-400 transition-colors duration-300 text-xl md:text-2xl text-center caret-white`}
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
                                    className={`text-base text-center md:text-lg w-full h-[150px] border-2 bg-transparent outline-none resize-none rounded border-white caret-white focus:border-orange-400 transition-colors duration-300 ${styles.custom_scroll}`}
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
                                {paragraphs.map((paragraph, paragraphIndex) => {
                                    return (
                                        <motion.div
                                            layout
                                            key={paragraph.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: .3, type: 'spring', bounce: 0.25 }}
                                            className="max-w-[1110px] flex flex-col justify-center items-center gap-4 p-3 rounded border-2 border-[#464544]"
                                        >
                                            <motion.input
                                                layout={'position'}
                                                placeholder={`Heading ${paragraphIndex + 1}`}
                                                {...register(`paragraphs.${paragraphIndex}.heading`)}
                                                className={`w-full h-[34px] bg-transparent outline-none border-b-2 border-white focus:border-orange-400 text-xl md:text-2xl text-center caret-white`}
                                            />

                                            <motion.p
                                                layout={'position'}
                                                className="text-orange-300 text-[13px] sm:text-[18px]"
                                            >
                                                {errors.paragraphs?.[paragraphIndex]?.heading?.message}
                                            </motion.p>

                                            {paragraph.cover && (
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

                                            <input
                                                type="file"
                                                onChange={(e) => handleCoverChange(paragraphIndex, e.target.files?.[0])}
                                                className="hidden"
                                                id={`cover-${paragraphIndex}`}
                                            />

                                            <motion.label
                                                layout={'position'}
                                                htmlFor={`cover-${paragraphIndex}`}
                                                className={`min-w-[185px] text-center py-2  bg-[#C2724F] rounded cursor-pointer select-none border border-[#F5DEB3] transition-colors duration-75 hover:bg-[#c2724f91]`}
                                            >
                                                {paragraph.cover ? 'Change Cover' : 'Upload Cover'}
                                            </motion.label>

                                            <div
                                                className=" w-full flex flex-col items-center gap-6"
                                            >
                                                <input type="range" {...register(`paragraphs.${paragraphIndex}.horizontalPosition`, { valueAsNumber: true })} onChange={(e) => handleSliderChange(paragraphIndex, true, e)} min="0" max="100" className={`${styles.custom_input_range} `} />
                                                <input type="range" {...register(`paragraphs.${paragraphIndex}.verticalPosition`, { valueAsNumber: true })} onChange={(e) => handleSliderChange(paragraphIndex, false, e)} min="0" max="100" className={`${styles.custom_input_range} `} />
                                            </div>

                                            <div className="w-full relative flex-col flex gap-4">

                                                <AnimatePresence mode="popLayout">
                                                    {paragraph.contents.map((content, contentIndex) => {
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
                                                                    onChange={(e) => handleImageChange(paragraphIndex, contentIndex, e.target.files?.[0])}
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
                                                                    {...register(`paragraphs.${paragraphIndex}.contents.${contentIndex}.text`)}

                                                                    className={`text-left text-sm md:text-base text-balance text-white w-full h-[150px] border-2 bg-transparent outline-none resize-none rounded border-white caret-white focus:border-orange-400 transition-colors duration-300 ${styles.custom_scroll}`}
                                                                />

                                                                <motion.p
                                                                    className="text-orange-300 text-[13px] sm:text-[18px]"
                                                                >
                                                                    {errors.paragraphs?.[paragraphIndex]?.contents?.[contentIndex]?.text?.message}
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


                            <div className="flex flex-col">
                                <button
                                    type="button"
                                    onClick={addParagraph}
                                    className={`max-w-[185px] bg-slate-500  py-2 rounded`}
                                >
                                    Add New Paragraph
                                </button>

                                <button type="submit" className={`max-w-[185px] mt-4 px-6 py-2 bg-green-500 rounded`}>
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
