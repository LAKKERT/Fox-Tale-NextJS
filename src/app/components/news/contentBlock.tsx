'use client';

import _ from "lodash";
import Image from "next/image";
import { ChangeEvent, useRef } from "react";
import styles from "@/app/styles/home/variables.module.scss";
import { FormValues } from "@/lib/types/news";
import { UseFormRegister, UseFieldArrayUpdate, FieldErrors, FieldArrayWithId, UseFieldArrayReplace } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

interface Props {
    register: UseFormRegister<FormValues>;
    update: UseFieldArrayUpdate<FormValues, "content_blocks">;
    replace: UseFieldArrayReplace<FormValues, "content_blocks">;
    errors: FieldErrors<FormValues>;
    editModeActive: boolean;
    content_blocks: FieldArrayWithId<FormValues, "content_blocks", string>[]

}

export function ContentBlocks({ register, update, replace, errors, editModeActive, content_blocks }: Props) {

    const imgRef = useRef<HTMLElement[]>([]);
    const textAreaRef = useRef<HTMLElement[][]>([]);

    const addContentBlock = (contentBlockIndex: number) => {
        const contentBlock = content_blocks[contentBlockIndex];
        const newContentOrder = contentBlock.content.length;
        update(contentBlockIndex, {
            ...contentBlock,
            content: [...contentBlock.content, { id: uuidv4(), content: '', image: null, order_index: newContentOrder }]
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

    const debouncedUpdate = useRef(
        _.debounce((block, contentBlockIndex, h, v) => {
            update(contentBlockIndex, {
                ...block[contentBlockIndex],
                vertical_position: v,
                horizontal_position: h
            });
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
    }

    return (
        <div>
            {content_blocks && content_blocks?.map((contentBlock, contentBlockIndex) => {
                return (
                    <motion.div
                        layout
                        key={contentBlock.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: .3, type: 'spring', bounce: 0.25 }}
                        className="max-w-[1110px] flex flex-col justify-center items-center gap-4 p-3"
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

                        {contentBlock.covers && (
                            <motion.div
                                layout="position"
                                className="w-full h-64 relative mb-4"
                            >
                                {process.env.NEXT_PUBLIC_ENV === 'production' ? (
                                    <Image
                                        ref={e => {
                                            if (e) {
                                                imgRef.current[contentBlockIndex] = e
                                            }
                                        }}
                                        src={
                                            typeof contentBlock.covers === 'string'
                                                ? `${contentBlock.covers}`
                                                : URL.createObjectURL(contentBlock.covers)
                                        }
                                        alt="covers"
                                        fill
                                        className={`transform-gpu rounded object-cover`}
                                        style={{ objectPosition: `${contentBlock.horizontal_position}% ${contentBlock.vertical_position}%` }}
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        quality={100}
                                    />
                                ) : (
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
                                )}
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
                                        <motion.section
                                            key={content.id}
                                            layout={'position'}
                                            transition={{ duration: .3, type: 'spring', bounce: 0.25 }}
                                            className=" w-full flex flex-col justify-center items-center gap-2 p-3"
                                        >
                                            {content.image && (
                                                <div className="w-full h-96 relative mb-4">
                                                    {process.env.NEXT_PUBLIC_ENV === 'production' ? (
                                                        <Image
                                                            src={typeof content.image === 'string'
                                                                ? `${content.image}`
                                                                : URL.createObjectURL(content.image)}
                                                            alt="Content"
                                                            fill
                                                            className="rounded object-contain"
                                                            sizes="(max-width: 768px) 100vw, 50vw"
                                                            quality={80}
                                                        />
                                                    ) : (

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
                                                    )}
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
                                                    {content.content}
                                                </pre>
                                            </div>

                                            <motion.textarea
                                                {...register(`content_blocks.${contentBlockIndex}.content.${contentIndex}.content`)}
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
                                                animate={{ opacity: errors.content_blocks?.[contentBlockIndex]?.content?.[contentIndex]?.content?.message ? 30 : 0, height: errors.content_blocks?.[contentBlockIndex]?.content?.[contentIndex]?.content?.message ? 'auto' : '0px' }}
                                                transition={{ duration: .3 }}
                                                className=" text-orange-300 text-[13px] sm:text-[18px]"
                                            >
                                                {errors.content_blocks?.[contentBlockIndex]?.content?.[contentIndex]?.content?.message}
                                            </motion.p>

                                            <motion.button
                                                type="button"
                                                onClick={() => deleteContentBlock(contentBlockIndex, contentIndex)}
                                                className={` min-w-[185px] bg-red-500 px-4 py-2 rounded  transition-colors duration-75 hover:bg-[#c40000] ${editModeActive ? 'block' : 'hidden'}`}
                                            >
                                                Delete Content Block
                                            </motion.button>
                                        </motion.section>
                                    )
                                })}
                            </AnimatePresence>
                        </div>

                        <button
                            type="button"
                            onClick={() => addContentBlock(contentBlockIndex)}
                            className={`min-w-[185px] bg-blue-400 px-4 py-2 rounded  transition-colors duration-75 hover:bg-[#4576b3] ${editModeActive ? 'block' : 'hidden'}`}
                        >
                            Add new paragraph
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
        </div>
    )
}