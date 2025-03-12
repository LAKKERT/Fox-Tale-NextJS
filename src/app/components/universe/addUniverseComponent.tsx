'use client';
import { Loader } from "@/app/components/load";
import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/userStore";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { saveFile } from "@/pages/api/news/saveImagesAPI";
import Image from "next/image";
import { K2D } from "next/font/google";
import { PT_Serif } from "next/font/google";
import { motion } from "framer-motion";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

const introductionFont = PT_Serif({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
})

type universeType = {
    cover: File
    name: string;
    description: string;
}

const validationSchema = Yup.object().shape({
    cover: Yup.mixed<File>()
        .test("required", "Cover is required", (value) => {
            return value instanceof File;
        })
        .required(),
    name: Yup.string().required("Name is required"),
    description: Yup.string().required("Description is required"),
})

export function AddUniverse() {
    const [isLoading, setIsLoading] = useState(false);

    const [selectedFile, setSelectedFiles] = useState<File | null>();
    const userData = useUserStore((state) => state.userData);

    const [cookies] = useCookies(['auth_token']);
    const router = useRouter();

    const { register, handleSubmit, formState: { errors }, trigger, setValue } = useForm<universeType>({
        resolver: yupResolver(validationSchema)
    })

    useEffect(() => {
        if (!cookies.auth_token || (userData && userData.role !== 'admin')) {
            router.push('/');
            return;
        }
    
        if (userData?.role === 'admin') {
            setIsLoading(false);
        } else {
            setIsLoading(true); 
        }
    
        const timeout = setTimeout(() => {
            if (!userData) {
                router.push('/');
            }
        }, 5000);
    
        return () => clearTimeout(timeout);
    }, [cookies, userData, router]);

    const onSubmit = async (data: universeType) => {
        try {
            const fileProperty = filesProperties(selectedFile);
            const fileData = await processFile(selectedFile)

            saveFile(fileData, fileProperty)

            const payload = {
                ...data,
                coverName: fileProperty
            }

            const response = await fetch(`/api/universe/universeAPI`, {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                    'Authorization': `Bearer ${cookies.auth_token}`
                },
                body: JSON.stringify(payload),
            })

            if (response.ok) {
                router.push(`/universe`);
            } else {
                console.error('error occurred')
            }
        } catch (error) {
            console.error(error)
        }
    }

    const processFile = async (file: File | null | undefined): Promise<string | null> => {
        if (!file || !(file instanceof File)) {
            return null;
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
        });
    };

    const filesProperties = (file) => {
        let name = file.name;

        const lastDot = name.lastIndexOf('.');

        const extension = name.slice(lastDot + 1);

        name = name.substring(0, lastDot);

        const fullFileName = `/uploads/universe/${Date.now()}_${name}.${extension}`;

        return fullFileName;
    }

    return (
        <div className={`min-h-[calc(100vh-100px)] flex flex-col items-center gap-4 mx-auto ${MainFont.className} text-[#F5DEB3] caret-transparent`}>
            {isLoading ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: .3 }}
                    className=" bg-black fixed inset-0 flex justify-center items-center"
                >
                    <Loader />
                </motion.div>
            ) : (
                <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`lg:max-w-6xl w-full mx-auto ${MainFont.className} text-white bg-black py-4`}
                >
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <motion.div className={`w-full bg-white`}
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
                        </motion.div>

                        <motion.div className="w-full flex flex-col items-center gap-3">
                            <input
                                type="file"
                                {...register('cover')}
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setSelectedFiles(e.target.files[0]);
                                        setValue("cover", e.target.files[0]);
                                        trigger('cover')
                                    }
                                }}
                                id="inputFile"
                                className="hidden"
                            />

                            <div className="flex flex-col">
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: errors.cover?.message || errors.name?.message ? 1 : 0, height: errors.cover?.message || errors.name?.message ? 30 : 0 }}
                                    transition={{ duration: .3 }}
                                    className="text-center text-orange-300 text-[13px] sm:text-[18px]"
                                >
                                    {errors.cover?.message || errors.name?.message}
                                </motion.p>

                                <label htmlFor="inputFile"
                                    className={` min-w-[185px] text-center py-2 mt-3 px-4 bg-[#C2724F] rounded cursor-pointer select-none border border-[#F5DEB3] transition-colors duration-75 hover:bg-[#c2724f91]`}
                                >
                                    {selectedFile ? 'Change cover' : 'Upload cover'}
                                </label>
                            </div>


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

                            <button type="submit" className={`mt-4 px-6 py-2 bg-green-500 rounded`}>
                                SAVE CHANGES
                            </button>
                        </motion.div>
                    </form>
                </motion.div>
            )}
        </div>
    )
}