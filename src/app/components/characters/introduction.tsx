'use client';

import { CharacterDetailData, CharacterInputData } from "@/lib/interfaces/character";
import { motion } from "framer-motion";
import Image from "next/image";
import { UseFormRegister } from "react-hook-form";

interface Props {
    register: UseFormRegister<CharacterInputData>;
    characterData: CharacterDetailData | undefined;
    selectedFile: File | null | undefined;
    isEditMode: boolean;
    changeSelectedFile: (file: File | null) => void;
}

export function Introduction({ register, characterData, selectedFile, isEditMode, changeSelectedFile }: Props) {
    return (
        <motion.section className={`w-full bg-white`}
            key={characterData?.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >

            <div className="relative caret-transparent h-full">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: .3 }}
                    className={`uppercase absolute inset-0 text-center text-balance flex items-center justify-center text-white text-xl md:text-7xl tracking-[5px] caret-transparent z-10 ${isEditMode ? 'hidden' : 'block'}`}
                >
                    {characterData?.name}
                </motion.p>

                <motion.input
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: .3 }}
                    placeholder="TITLE"
                    {...register('name')}
                    className={`absolute uppercase w-full bg-transparent outline-none top-0 bottom-0 my-auto text-white placeholder:text-white text-xl md:text-7xl tracking-[5px] text-center focus:caret-white ${isEditMode ? 'block' : 'hidden'}`}
                />
                {process.env.NEXT_PUBLIC_ENV === 'production' ? (
                    <Image
                        src={!selectedFile
                            ? `${characterData?.cover}`
                            : URL.createObjectURL(selectedFile)
                        }
                        alt="Selected cover"
                        width={500}
                        height={300}
                        className="w-full h-full object-cover"
                    />
                ) : (

                    <Image
                        src={!selectedFile
                            ? `http://localhost:3000/${characterData?.cover}`
                            : URL.createObjectURL(selectedFile)
                        }
                        alt="Selected cover"
                        width={500}
                        height={300}
                        className="w-full h-full object-cover"
                    />
                )}

                <input
                    type="file"
                    {...register('cover')}
                    onChange={(e) => {
                        if (e.target.files) {
                            changeSelectedFile(e.target.files[0]);
                        }
                    }}
                    id="inputFile"
                    className="hidden"
                />

            </div>
        </motion.section>
    )
}