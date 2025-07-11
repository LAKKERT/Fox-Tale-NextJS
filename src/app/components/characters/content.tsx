'use client';

import { CharacterInputData, CharacterDetailData } from "@/lib/interfaces/character";
import { UniverseType } from "@/lib/types/universe";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Control, Controller, FieldErrors, UseFormRegister } from "react-hook-form";

interface Props {
    register: UseFormRegister<CharacterInputData>;
    control: Control<CharacterInputData, unknown, CharacterInputData>;
    selectedTerritories: number[];
    errors: FieldErrors<CharacterInputData>;
    allTerritories: UniverseType[];
    territories: UniverseType[];
    isEditMode: boolean;
    characterData: CharacterDetailData | undefined;
    changeSelectedCards: (id: number) => void;
}

export function Content({ register, control, selectedTerritories, allTerritories, territories, isEditMode, errors, characterData, changeSelectedCards }: Props) {
    return (
        <div className="w-full flex flex-col items-center">
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
                            animate={{ opacity: errors.name?.message ? 1 : 0, height: errors.name?.message ? 30 : 0 }}
                            transition={{ duration: .3 }}
                            className="text-center text-orange-300 text-[13px] sm:text-[18px]"
                        >
                            {errors.name?.message}
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
                            className={`min-w-[185px] max-h-[42px] text-center py-2  px-4 bg-[#C2724F] rounded cursor-pointer select-none border border-[#F5DEB3]`}
                        >
                            Change cover
                        </motion.label>
                    </div>
                )}
            </motion.div>


            <motion.div layout={'position'} className="max-w-[640px] w-full h-auto flex flex-col gap-3">
                <section>
                    <pre className={`text-lg text-wrap text-[#F5DEB3] px-2 md:px-0 ${isEditMode ? 'hidden' : 'block'}`}>
                        {characterData?.description}
                    </pre>
                </section>

                <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: errors.description?.message ? 1 : 0, height: errors.description?.message ? 30 : 0 }}
                    transition={{ duration: .3 }}
                    className="text-center text-orange-300 text-[13px] sm:text-[18px]"
                >
                    {errors.description?.message}
                </motion.p>
                <motion.textarea
                    {...register(`description`)}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;

                        target.style.height = "auto";
                        target.style.minHeight = "50px";
                        target.style.height = `${target.scrollHeight}px`;
                    }}
                    className={` text-left text-lg text-wrap px-2 text-[#F5DEB3] overflow-hidden py-2 w-full border-2 bg-transparent outline-none resize-none rounded border-white focus:border-orange-400 transition-colors duration-300 ${isEditMode ? 'block' : 'hidden'} focus:caret-white`}
                    style={{
                        boxSizing: "border-box"
                    }}
                />
            </motion.div>

            <div>
                <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: errors.territories?.message ? 1 : 0, height: errors.territories?.message ? 30 : 0 }}
                    transition={{ duration: .3 }}
                    className="text-center text-orange-300 text-[13px] sm:text-[18px]"
                >
                    {errors.territories?.message}
                </motion.p>

                <Controller
                    control={control}
                    name="territories"
                    defaultValue={selectedTerritories}
                    render={({ field }) => {
                        return (
                            <motion.div layout={'position'} className="flex flex-col items-center gap-4">
                                <h2 className="uppercase text-2xl">TERRITORIES</h2>
                                <div className="w-full max-w-xl sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl flex flex-wrap justify-center gap-3 ">
                                    {territories.length > 0 ? (
                                        territories.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    borderColor: isEditMode && selectedTerritories.includes(item.id)
                                                        ? "#C2724F"
                                                        : "transparent"
                                                }}
                                                exit={{ opacity: 0, scale: 0 }}
                                                transition={{
                                                    duration: 0.3,
                                                    ease: "easeInOut",
                                                    scale: { type: "spring" }
                                                }}
                                                whileTap={{ scale: 0.95 }}

                                                onClick={() => {
                                                    if (isEditMode) {
                                                        const newValue = field.value.includes(item.id)
                                                            ? field.value.filter(value => value !== item.id)
                                                            : [...field.value, item.id]
                                                        changeSelectedCards(item.id)
                                                        field.onChange(newValue)
                                                    }
                                                }}
                                                className={`border-4 rounded-lg flex justify-center gap-3 ${isEditMode ? 'z-10' : 'z-0'}`}
                                            >
                                                <Link href={`/universe/${item.id}`} className={` ${isEditMode ? 'pointer-events-none' : ''} ${isEditMode ? 'z-0' : 'z-10'}`}>
                                                    <motion.div
                                                        whileHover='hover'
                                                        className=" relative w-[250px] h-[345px] rounded shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                                                    >
                                                        <Image
                                                            src={`http://localhost:3000/${item.cover}`}
                                                            alt="Place Cover"
                                                            fill
                                                            sizes="(max-width: 768px) 100vw, 50vw"
                                                            className="object-cover object-center"
                                                            quality={100}
                                                        />

                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <h1 className="uppercase text-2xl text-white z-10 drop-shadow-lg">
                                                                {item.name}
                                                            </h1>
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
                                                                <span className="text-lg">Read more</span>
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
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div>No territories</div>
                                    )}
                                </div>

                                <div className={`w-full flex flex-col justify-center  ${isEditMode ? 'block' : 'hidden'}`}>
                                    <motion.h2
                                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                        animate={{ opacity: isEditMode ? 1 : 0, y: isEditMode ? -10 : 0, scale: isEditMode ? 1 : 0.98 }}
                                        transition={{ duration: .3 }}
                                        className="text-center uppercase text-2xl">ALL TERRITORIES
                                    </motion.h2>
                                    <div className="w-full flex flex-wrap justify-center gap-3">
                                        {allTerritories.length > 0 ? (
                                            <AnimatePresence mode='popLayout'>
                                                {allTerritories.map((item) => (
                                                    <motion.article
                                                        key={item.id}
                                                        initial={{ opacity: 0, scale: 0.5 }}
                                                        animate={{
                                                            opacity: 1,
                                                            scale: 1,
                                                            borderColor: isEditMode && selectedTerritories.includes(item.id)
                                                                ? "#C2724F"
                                                                : "transparent"
                                                        }}
                                                        exit={{ opacity: 0, scale: 0 }}
                                                        transition={{
                                                            duration: 0.3,
                                                            ease: "easeInOut",
                                                            scale: { type: "spring" }
                                                        }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => {
                                                            if (isEditMode) {
                                                                const newValue = field.value.includes(item.id)
                                                                    ? field.value.filter(value => value !== item.id)
                                                                    : [...field.value, item.id]
                                                                changeSelectedCards(item.id)
                                                                field.onChange(newValue);
                                                            }
                                                        }}
                                                        className={`border-4 rounded-lg flex justify-center gap-3 ${isEditMode ? 'z-10' : 'z-0'}`}
                                                    >
                                                        <Link href={`/universe/${item.id}`} className={` ${isEditMode ? 'pointer-events-none' : ''} ${isEditMode ? 'z-0' : 'z-20'}`}>
                                                            <motion.div
                                                                whileHover='hover'
                                                                className=" relative w-[250px] h-[345px] rounded shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                                                            >
                                                                <Image
                                                                    src={`http://localhost:3000/${item.cover}`}
                                                                    alt="Place Cover"
                                                                    fill
                                                                    sizes="(max-width: 768px) 100vw, 50vw"
                                                                    className="object-cover object-center"
                                                                    quality={100}
                                                                />

                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <p className="uppercase text-2xl text-white z-10 drop-shadow-lg">
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
                                                                        <span className="text-lg">Read more</span>
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
                                            </AnimatePresence>
                                        ) : (
                                            <div>No territories available</div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    }}
                />
            </div>
        </div>
    )
}