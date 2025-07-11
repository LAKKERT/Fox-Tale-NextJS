'use client';

import { motion, AnimatePresence } from "framer-motion";
import { ChangeEvent, useRef } from "react";
import _ from "lodash";
import Image from "next/image";
import { FieldArrayWithId, FieldErrors, UseFieldArrayReplace, UseFieldArrayUpdate, UseFormRegister } from "react-hook-form";
import { FormValues } from "@/lib/types/news";
import styles from "@/app/styles/home/variables.module.scss";
import { v4 as uuidv4 } from "uuid";

interface Props {
    register: UseFormRegister<FormValues>;
    update: UseFieldArrayUpdate<FormValues, "content_blocks">;
    replace: UseFieldArrayReplace<FormValues, "content_blocks">;
    content_blocks: FieldArrayWithId<FormValues, "content_blocks", string>[];
    errors: FieldErrors<FormValues>;
}

export function ContentBlockFields({register, update, replace, content_blocks, errors}: Props) {

    const imgRef = useRef<HTMLElement[]>([]);

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
        <div>
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
                                accept="image/*"
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
                                                accept="image/*"
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
        </div>
    )
}