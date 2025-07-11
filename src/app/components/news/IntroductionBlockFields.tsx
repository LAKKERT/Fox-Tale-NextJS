'use client';

import { motion } from "framer-motion";
import styles from "@/app/styles/home/variables.module.scss";
import { FormValues } from "@/lib/types/news";
import { FieldErrors, UseFormRegister } from "react-hook-form";

interface Props {
    register: UseFormRegister<FormValues>;
    errors: FieldErrors<FormValues>;
}

export function IntroductionBlockFields({ register, errors }: Props) {
    return (
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
                className={`w-full bg-transparent outline-none border-b-2 border-white focus:border-orange-400 transition-colors duration-300 text-xl md:text-2xl text-center focus:caret-white`}
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
                className={`text-base text-center md:text-lg w-full h-[150px] border-2 bg-transparent outline-none resize-none rounded border-white focus:caret-white focus:border-orange-400 transition-colors duration-300 ${styles.custom_scroll}`}
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
    )
}