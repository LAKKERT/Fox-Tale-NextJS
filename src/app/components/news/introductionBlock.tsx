'use client';

import { FormValues, NewsStructure } from "@/lib/types/news";
import { motion } from "framer-motion";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import styles from "@/app/styles/home/variables.module.scss";
import { ToolBar } from "@/app/components/news/toolBar";

interface Props {
    register: UseFormRegister<FormValues>;
    postData: NewsStructure | undefined;
    editModeActive: boolean;
    deletePost: boolean;
    errors: FieldErrors<FormValues>;
    userRole: string | undefined;
    editModeChange: (editMode: boolean, deleteMode: boolean) => void;
    params: Record<string, string | string[]> | null;
}

export function IntroductionBlock({ register, postData, editModeActive, deletePost, errors, userRole, editModeChange, params }: Props) {
    return (
        <motion.div
            className=" min-h-[260px] max-w-[1110px] flex flex-col justify-evenly gap-3 text-center text-balance"
        >
            <h1 className={`text-xl md:text-2xl ${editModeActive ? 'hidden' : 'block'}`}>
                {postData?.title}
            </h1>

            <motion.input
                {...register('title')}
                className={` w-full bg-transparent outline-none border-b-2 border-white focus:border-orange-400 transition-colors duration-300 text-xl md:text-2xl text-center focus:caret-white ${editModeActive ? 'block' : 'hidden'}`}
            />

            <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: errors.title?.message ? 30 : 0, height: errors.title?.message ? 'auto' : '0px' }}
                transition={{ duration: .3 }}
                className=" text-orange-300 text-[13px] sm:text-[18px]"
            >
                {errors.title?.message}
            </motion.p>

            <p
                className={`text-base md:text-lg ${editModeActive ? 'hidden' : 'block'}`}
            >
                {postData?.description}
            </p>

            <motion.textarea
                {...register('description')}
                onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;

                    target.style.height = "auto";
                    target.style.minHeight = "50px";
                    target.style.height = `${target.scrollHeight}px`;
                }}
                className={`text-center text-sm md:text-base text-balance text-[#F5DEB3] overflow-hidden py-2 w-full border-2 bg-transparent outline-none resize-none rounded border-white focus:border-orange-400 transition-colors duration-300 ${styles.custom_scroll} ${editModeActive ? 'block' : 'hidden'} focus:caret-white`}
                style={{

                    maxHeight: "70vh",
                    boxSizing: "border-box"
                }}
            />

            <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: errors.description?.message ? 30 : 0, height: errors.description?.message ? 'auto' : '0px' }}
                transition={{ duration: .3 }}
                className=" text-orange-300 text-[13px] sm:text-[18px]"
            >
                {errors.description?.message}
            </motion.p>

            <ToolBar postData={postData} userRole={userRole} editModeActive={editModeActive} deletePost={deletePost} editModeChange={editModeChange} params={params} />
        </motion.div>
    )
}