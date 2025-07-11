'use client';

import { DetailUniverseType } from "@/lib/types/universe";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { CharacterData } from "@/lib/interfaces/character";

interface Props {
    register: UseFormRegister<DetailUniverseType>;
    isEditMode: boolean;
    errors: FieldErrors<DetailUniverseType>;
    universeData: DetailUniverseType | undefined;
    characters: CharacterData[];
}

export function Content({ register, isEditMode, errors, universeData, characters }: Props) {
    console.log(characters)
    return (
        <motion.div
            layout
            animate={{
                gap: isEditMode ? '12px' : '0px',
                transitionEnd: {
                    gap: isEditMode ? "12px" : '0'
                }
            }}

            className="w-full flex flex-col items-center"
            transition={{
                duration: .3,
                ease: "easeInOut"
            }}

        >

            <motion.div
                initial={{ height: 'auto' }}
                animate={{
                    height: isEditMode ? 'auto' : '0',
                    transition: {
                        duration: .3,
                        ease: "easeInOut"
                    }
                }}
            >
                {isEditMode && (
                    <div className="flex flex-col">
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: errors.cover?.message || errors.name?.message ? 1 : 0, height: errors.cover?.message || errors.name?.message ? 30 : 0 }}
                            transition={{ duration: .3 }}
                            className="text-center text-orange-300 text-[13px] sm:text-[18px]"
                        >
                            {errors.cover?.message || errors.name?.message}
                        </motion.p>
                        <motion.label
                            htmlFor="inputFile"
                            initial={{
                                opacity: 0,
                                scale: 0.95,
                                y: 10
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0
                            }}
                            exit={{
                                opacity: 0,
                                y: 10
                            }}
                            transition={{
                                duration: 0.2,
                                ease: "easeInOut"
                            }}
                            className={`min-w-[185px] max-h-[42px] text-center py-2 mt-3 px-4 bg-[#C2724F] rounded cursor-pointer select-none border border-[#F5DEB3]`}
                        >
                            Change cover
                        </motion.label>
                    </div>
                )}
            </motion.div>

            <motion.div layout={'position'} className="max-w-[640px] w-full h-auto flex flex-col gap-3 mt-4">
                <section>
                    <pre className={`text-lg text-wrap text-[#F5DEB3] px-2 md:px-0 ${isEditMode ? 'hidden' : 'block'}`}>
                        {universeData?.description}
                    </pre>
                </section>
                <motion.textarea
                    {...register(`description`)}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;

                        target.style.height = "auto";
                        target.style.minHeight = "50px";
                        target.style.height = `${target.scrollHeight}px`;
                    }}
                    className={`text-left text-sm md:text-base text-balance px-2 text-[#F5DEB3] overflow-hidden py-2 w-full border-2 bg-transparent outline-none resize-none rounded border-white focus:border-orange-400 transition-colors duration-300 ${isEditMode ? 'block' : 'hidden'} focus:caret-white`}
                    style={{
                        maxHeight: "70vh",
                        boxSizing: "border-box"
                    }}
                />
            </motion.div>

            {characters.length > 0 ? (
                <motion.div layout={'position'} className={`w-full flex flex-col items-center gap-3`}>
                    <h3 className={`uppercase text-2xl`}>CHARACTERS</h3>
                    <div className="w-full max-w-xl sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl flex flex-wrap flex-row justify-center gap-3 ">
                        {characters.map((item) => (
                            <motion.article
                                key={item.id}
                                initial={{ scale: 1 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                whileTap="tap"
                                className={`rounded-lg flex justify-center gap-3 ${isEditMode ? 'z-10' : 'z-0'}`}
                            >
                                <Link href={`/characters/${item.id}`} className={`${isEditMode ? "pointer-events-none" : ''}`}>
                                    <motion.div
                                        className="relative w-[250px] h-[345px] bg-white rounded shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                                        whileHover="hover"
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {process.env.NEXT_PUBLIC_ENV === 'production' ? (
                                            <Image
                                                src={`${item.cover}`}
                                                alt="Place Cover"
                                                fill
                                                sizes="(max-width: 768px) 100vw, 50vw"
                                                className="object-cover object-center"
                                                quality={100}
                                            />
                                        ) : (
                                            <Image
                                                src={`http://localhost:3000/${item.cover}`}
                                                alt="Place Cover"
                                                fill
                                                sizes="(max-width: 768px) 100vw, 50vw"
                                                className="object-cover object-center"
                                                quality={100}
                                            />
                                        )}

                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <p className="uppercase text-2xl text-center text-balance text-white z-10 drop-shadow-lg">
                                                {item.name}
                                            </p>
                                        </div>

                                        <motion.div
                                            variants={{ hover: { opacity: 0.3 } }}
                                            className="absolute inset-0 bg-black/0"
                                        />

                                        <motion.div
                                            variants={{
                                                hover: {
                                                    opacity: 1,
                                                    y: 0,
                                                    transition: {
                                                        duration: 0.3
                                                    }
                                                }
                                            }}
                                            initial={{ opacity: 0, y: 50 }}
                                            className="absolute bottom-0 w-full bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4"
                                        >
                                            <div className="flex w-full items-center justify-between text-white">
                                                <p className="text-lg">Read more</p>
                                                <motion.div
                                                    variants={{
                                                        hover: { x: 5 },
                                                    }}
                                                    className="w-6 h-6"
                                                >
                                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                </Link>
                            </motion.article>
                        ))}
                    </div>
                </motion.div>
            ) : (
                null
            )}
            <motion.button
                layout

                initial={{
                    opacity: 0,
                    y: -10,
                    scale: 0.98
                }}

                animate={{
                    opacity: isEditMode ? 1 : 0,
                    y: isEditMode ? 0 : -10,
                    scale: isEditMode ? 1 : 0.98,
                    display: isEditMode ? "inline-block" : "none",
                    transition: {
                        duration: 0.3,
                        ease: "easeInOut"
                    },
                    transitionEnd: {
                        display: isEditMode ? "inline-block" : "none",
                    },
                }}

                transition={{
                    layout: {
                        duration: 0.3,
                        ease: "easeInOut"
                    }
                }}
                type="submit" className={`mt-4 px-6 py-2 bg-green-500 rounded`}>
                SAVE CHANGES
            </motion.button>
        </motion.div>
    )
}