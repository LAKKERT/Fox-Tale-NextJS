'use client';

import { Loader } from "@/app/components/load";
import { useCallback, useState } from "react";
import { useCookies } from "react-cookie";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { saveFile } from "@/pages/api/news/saveImagesAPI";
import { K2D } from "next/font/google";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/supabaseClient";
import { Header } from "@/app/components/header";
import { Footer } from "@/app/components/footer";
import { CreateUniverseType } from "@/lib/types/universe";
import { IntroductionFields } from "@/app/components/universe/introductionFields";
import { ContentFields } from "@/app/components/universe/contentFields";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

const validationSchema = Yup.object().shape({
    cover: Yup.mixed<File>()
        .test("required", "Cover is required", (value) => {
            return value instanceof File;
        })
        .required(),
    name: Yup.string().required("Name is required"),
    description: Yup.string().required("Description is required"),
})

export default function UniversePage() {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFiles] = useState<File | null>(null);

    const [cookies] = useCookies(['auth_token']);
    const router = useRouter();

    const { register, handleSubmit, formState: { errors }, trigger, setValue } = useForm<CreateUniverseType>({
        resolver: yupResolver(validationSchema)
    })

    const handleRole = (role: string) => {
        if (role !== 'admin') {
            router.push('/');
        } else {
            setIsLoading(false);
        }

    }

    const onSubmit = async (data: CreateUniverseType) => {
        try {
            let fileData;
            let fileProperty;
            if (selectedFile !== null) {
                fileProperty = filesProperties(selectedFile);
                fileData = await processFile(selectedFile);

                saveFile(fileData, fileProperty);
            }

            if (process.env.NEXT_PUBLIC_ENV === 'production') {
                const { error } = await supabase
                    .from('universe')
                    .insert({
                        name: data.name,
                        description: data.description,
                        cover: fileProperty
                    });
                if (error) {
                    console.error(error);
                } else {
                    router.push('/universe');
                }
            } else {
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

    const filesProperties = (file: File) => {
        let name = file.name;

        const lastDot = name.lastIndexOf('.');

        const extension = name.slice(lastDot + 1);

        name = name.substring(0, lastDot);

        const fullFileName = `/uploads/universe/${Date.now()}_${name}.${extension}`;

        return fullFileName;
    }

    const changeSelectedFile = useCallback((file: File | null) => {
        setSelectedFiles(file);
    }, []);

    return (
        <div className="w-full min-h-[calc(100vh-100px)] mt-[100px] bg-black object-cover bg-cover bg-center bg-no-repeat overflow-hidden caret-transparent">
            <Header role={handleRole} />
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

                            <IntroductionFields register={register} setValue={setValue} trigger={trigger} errors={errors} selectedFile={selectedFile} changeSelectedFile={changeSelectedFile} />

                            <ContentFields register={register} errors={errors} />
                        </form>
                    </motion.div>
                )}
            </div>
            <Footer />
        </div>
    )
}