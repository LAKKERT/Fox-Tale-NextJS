'use client';

import { CharacterCard } from "@/lib/interfaces/character";
import { motion } from "framer-motion";
import { PT_Serif } from "next/font/google";
import Image from "next/image";
import { FieldErrors, UseFormRegister, UseFormSetValue, UseFormTrigger } from "react-hook-form";

interface Props {
    register: UseFormRegister<CharacterCard>;
    setValue: UseFormSetValue<CharacterCard>;
    trigger: UseFormTrigger<CharacterCard>;
    selectedFile: File | null;
    errors: FieldErrors<CharacterCard>;
    changeSelectedFile: (file: File | null) => void;
}

const introductionFont = PT_Serif({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
})

export function IntroductionFields({ register, setValue, trigger, selectedFile, errors, changeSelectedFile }: Props) {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {selectedFile ? (
                <div className="relative">
                    <motion.input
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: .3 }}
                        placeholder="NAME"
                        {...register('name')}
                        className={`absolute w-full bg-transparent outline-none top-0 bottom-0 my-auto text-white placeholder:text-white text-xl md:text-4xl tracking-[5px] text-center focus:caret-white ${introductionFont.className}`}
                    />

                    <Image
                        src={
                            URL.createObjectURL(selectedFile)
                        }
                        alt="Selected cover"
                        width={500}
                        height={300}
                        className="w-full h-full"
                    />
                </div>

            ) : (
                null
            )}

            <div className="flex flex-col items-center">
                <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: errors.cover?.message || errors.name?.message ? 1 : 0, height: errors.cover?.message || errors.name?.message ? 30 : 0 }}
                    transition={{ duration: .3 }}
                    className="text-center text-orange-300 text-[13px] sm:text-[18px]"
                >
                    {errors.cover?.message || errors.name?.message}
                </motion.p>

                <input
                    type="file"
                    {...register('cover')}
                    onChange={(e) => {
                        if (e.target.files) {
                            changeSelectedFile(e.target.files[0]);
                            setValue('cover', e.target.files[0]);
                            trigger('cover')
                        }
                    }}
                    accept="image/*"
                    id="inputFile"
                    className="hidden"
                />

                <label htmlFor="inputFile"
                    className={`max-w-[185px] w-full text-center py-2 px-4 bg-[#C2724F] rounded cursor-pointer select-none border border-[#F5DEB3] transition-colors duration-75 hover:bg-[#c2724f91]`}
                >
                    {selectedFile ? 'Change cover' : 'Upload cover'}
                </label>
            </div>
        </motion.div>
    )
}