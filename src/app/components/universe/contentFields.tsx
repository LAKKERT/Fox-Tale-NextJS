'use client';

import { CreateUniverseType } from "@/lib/types/universe";
import { motion } from "framer-motion";
import { UseFormRegister, FieldErrors } from "react-hook-form";

interface Props {
    register: UseFormRegister<CreateUniverseType>;
    errors: FieldErrors<CreateUniverseType>;
}

export function ContentFields({ register, errors }: Props) {
    return (
        <motion.div className="w-full flex flex-col items-center gap-3">
            <div className="max-w-[640px] w-full h-auto flex flex-col gap-3 px-2 md:px-0">
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
                        maxHeight: "70vh",
                        boxSizing: "border-box"
                    }}
                    placeholder="DESCRIPTION"
                >
                </textarea>
            </div>

            <button type="submit" className={`px-6 py-2 bg-green-500 rounded`}>
                SAVE CHANGES
            </button>
        </motion.div>
    )
}