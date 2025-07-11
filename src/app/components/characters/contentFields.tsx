'use client';

import { CharacterCard } from "@/lib/interfaces/character";
import { UniverseType } from "@/lib/types/universe";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
interface Props {
    register: UseFormRegister<CharacterCard>;
    control: Control<CharacterCard, unknown, CharacterCard>;
    errors: FieldErrors<CharacterCard>;
    territories: UniverseType[];
    allTerritories: UniverseType[];
    selectedTerritories: number[];
    changeSelectedCards: (id: number) => void;
}

export function Content({ register, control, errors, territories, allTerritories, selectedTerritories, changeSelectedCards }: Props) {

    return (
        <motion.div className="w-full flex flex-col items-center gap-3">

            <motion.div
                className="max-w-[640px] w-full h-auto flex flex-col px-2 md:px-0"
            >
                <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: errors.description?.message ? 1 : 0, height: errors.description?.message ? 30 : 0 }}
                    transition={{ duration: .3 }}
                    className="text-center text-orange-300 text-[13px] sm:text-[18px]"
                >
                    {errors.description?.message}
                </motion.p>

                <textarea
                    {...register('description')}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;

                        target.style.height = "auto";
                        target.style.minHeight = "50px";
                        target.style.height = `${target.scrollHeight}px`;
                    }}
                    className={`text-left text-sm md:text-base text-balance text-[#F5DEB3] overflow-hidden p-2 w-full border-2 bg-transparent outline-none resize-none rounded border-white focus:border-orange-400 transition-colors duration-300 focus:caret-white`}
                    style={{
                        boxSizing: "border-box"
                    }}
                    placeholder="DESCRIPTION"
                >
                </textarea>
            </motion.div>

            <motion.div className="flex flex-col items-center">
                <h2 className="uppercase text-2xl">SELECTED TERRITORIES</h2>

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
                        name="territories"
                        control={control}
                        defaultValue={[]}
                        render={({ field }) => (
                            <div>
                                <div className="w-full max-w-xl sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl flex flex-wrap justify-center gap-3">
                                    {selectedTerritories.length > 0 ? (
                                        <AnimatePresence mode="popLayout">
                                            {territories.map((item) => (
                                                <motion.div
                                                    key={item.id}
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{
                                                        opacity: 1,
                                                        scale: 1,
                                                        borderColor: selectedTerritories.includes(item.id)
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
                                                        const newValue = field.value.includes(item.id)
                                                            ? field.value.filter(id => id !== item.id)
                                                            : [...field.value, item.id];
                                                        changeSelectedCards(item.id);
                                                        field.onChange(newValue);
                                                    }}
                                                    className={`border-4 rounded-lg flex justify-center gap-3 `}
                                                >

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
                                                    </motion.div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    ) : (
                                        <p>Territories not selected</p>
                                    )}
                                </div>


                                <div className={`w-full flex flex-col justify-center gap-3 `}>
                                    <h2 className="text-center uppercase text-2xl">ALL TERRITORIES</h2>
                                    <div className="w-full flex flex-wrap justify-center gap-3">
                                        {allTerritories.length > 0 ? (
                                            <AnimatePresence mode='popLayout'>
                                                {allTerritories.map((item) => (
                                                    <motion.div
                                                        key={item.id}
                                                        initial={{ opacity: 0, scale: 0.5 }}
                                                        animate={{
                                                            opacity: 1,
                                                            scale: 1,
                                                            borderColor: selectedTerritories.includes(item.id)
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
                                                            const newValue = field.value.includes(item.id)
                                                                ? field.value.filter(id => id !== item.id)
                                                                : [...field.value, item.id];
                                                            changeSelectedCards(item.id);
                                                            field.onChange(newValue);
                                                        }}
                                                        className={`border-4 rounded-lg flex justify-center gap-3`}
                                                    >

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
                                                        </motion.div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        ) : (
                                            <p>No territories available</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    />
                </div>
            </motion.div>

            <button type="submit" className={`px-6 py-2 bg-green-500 rounded`}>
                SAVE CHANGES
            </button>
        </motion.div>
    )
}