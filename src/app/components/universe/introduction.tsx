'use client';

import { DetailUniverseType } from "@/lib/types/universe";
import { motion } from "framer-motion";
import Image from "next/image";
import { UseFormRegister } from "react-hook-form";

interface Props {
    register: UseFormRegister<DetailUniverseType>;
    universeData: DetailUniverseType | undefined;
    selectedFile: File | null | undefined;
    isEditMode: boolean;
    changeCover: (image: File | null) => void;
}

export function Introduction({ register, universeData, selectedFile, isEditMode, changeCover  }: Props) {

    return (
        <motion.div className={`w-full bg-white`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >

            <div className="relative caret-transparent h-full ">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: .3 }}
                    className={`uppercase absolute inset-0 flex items-center justify-center text-white text-xl md:text-7xl tracking-[5px] caret-transparent z-10 ${isEditMode ? 'hidden' : 'block'}`}
                >
                    {universeData?.name}
                </motion.h1>

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
                            ? `${universeData?.cover}`
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
                            ? `http://localhost:3000/${universeData?.cover}`
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
                            changeCover(e.target.files[0]);
                        }
                    }}
                    id="inputFile"
                    className="hidden"
                />

            </div>
        </motion.div>
    )
}