'use client';
import { Loader } from "@/app/components/load";
import { useCookies } from "react-cookie";
import { useState, useEffect, useCallback } from "react";
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
import { UniverseType } from "@/lib/types/universe";
import { CharacterCard } from "@/lib/interfaces/character";
import { IntroductionFields } from "@/app/components/characters/introductionFields";
import { Content } from "@/app/components/characters/contentFields";

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
    territories: Yup.array()
        .of(Yup.number().required())
        .min(1, "Select at least one territory")
        .required("Territories are required")
})

export default function AddCharacterPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFile, setSelectedFiles] = useState<File | null>(null);
    const [selectedTerritories, setSelectedTerritories] = useState<number[]>([]);
    const [territories, setTerritories] = useState<UniverseType[]>([]);
    const [allTerritories, setAllTerritories] = useState<UniverseType[]>([]);
    const [allUniverses, setAllUniverses] = useState<UniverseType[]>([]);
    const [cookies] = useCookies(['auth_token']);
    const router = useRouter();

    const { control, register, handleSubmit, formState: { errors }, setValue, trigger } = useForm<CharacterCard>({
        resolver: yupResolver(validationSchema)
    })

    const handleRole = (role: string) => {
        if (role !== 'admin') {
            router.push('/');
        } else {
            setIsLoading(false);
        }

    }

    useEffect(() => {
        const getTerritories = async () => {
            try {
                if (process.env.NEXT_PUBLIC_ENV === 'production') {
                    const { data, error } = await supabase
                        .from('universe')
                        .select('id, name, cover, description')
                    if (error) {
                        console.error(error);
                    } else {
                        setAllTerritories(data);
                        setAllUniverses(data)
                        setIsLoading(false);
                    }
                } else {
                    const response = await fetch('/api/universe/fetchUniverseData', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })

                    const result = await response.json();

                    if (response.ok) {
                        setAllTerritories(result.data);
                        setAllUniverses(result.data);
                        setIsLoading(false);
                    } else {
                        console.error('Error fetching territories');
                    }
                }

            } catch (error) {
                console.error('Error fetching territories:', error);
            }
        }
        getTerritories()
    }, [cookies, router]);

    const onSubmit = async (data: CharacterCard) => {
        try {
            let fileData;
            let fileProperty;
            if (selectedFile !== null) {
                fileProperty = filesProperties(selectedFile);
                fileData = await processFile(selectedFile);

                saveFile(fileData, fileProperty);
            }

            data.territories = selectedTerritories;

            if (process.env.NEXT_PUBLIC_ENV === 'production') {
                const { data: characterData, error } = await supabase
                    .from('characters')
                    .insert({
                        name: data.name,
                        description: data.description,
                        cover: fileProperty
                    })
                    .select('id')
                    .single();
                if (error) {
                    console.error(error)
                } else {
                    for (const territory of data.territories) {
                        const { error } = await supabase
                            .from('character_territories')
                            .insert({
                                territory_id: territory,
                                character_id: characterData.id
                            });

                        if (error) {
                            console.error(error);
                        } else {
                            router.push('/characters')
                        }
                    }
                }
            } else {
                const payload = {
                    ...data,
                    coverName: fileProperty
                };

                const response = await fetch(`/api/characters/charactersAPI`, {
                    method: 'POST',
                    headers: {
                        'Content-type': 'application/json',
                        'Authorization': `Bearer ${cookies.auth_token}`
                    },
                    body: JSON.stringify(payload),
                });

                if (response.ok) {
                    router.push(`/characters`);
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

        const fullFileName = `/uploads/characters/${Date.now()}_${name}.${extension}`;

        return fullFileName;
    }

    const changeSelectedCards = useCallback((id: number) => {
                setSelectedTerritories(prev => {
            const isAlreadySelected = prev.includes(id);
            const newSelected = isAlreadySelected
                ? prev.filter(item => item !== id)
                : [...prev, id];

            setTerritories(prevTerritories => {
                if (isAlreadySelected) {
                    return prevTerritories.filter(item => item.id !== id);
                } else {
                    const newItem = allUniverses.find(item => item.id === id);
                    return newItem ? [...prevTerritories, newItem] : prevTerritories;
                }
            });


            setAllTerritories(prevAll => {
                if (isAlreadySelected) {
                    const newItem = allUniverses.find(t => t.id === id);
                    return newItem ? [...prevAll, newItem] : prevAll;
                } else {
                    return prevAll.filter(item => item.id !== id);
                }
            });

            return newSelected;
        });
    }, [allUniverses])

    const changeSelectedFile = useCallback((file: File | null) => {
        setSelectedFiles(file);
    }, [])

    return (
        <div className="w-full min-h-[calc(100vh-100px)] mt-[100px] bg-black object-cover bg-cover bg-center bg-no-repeat overflow-hidden caret-transparent">
            <Header role={handleRole} />
            <div className={`min-h-[calc(100vh-100px)] flex flex-col items-center mx-auto ${MainFont.className} text-[#F5DEB3] caret-transparent`}>
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
                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" >
                            <IntroductionFields register={register} setValue={setValue} trigger={trigger} selectedFile={selectedFile} errors={errors} changeSelectedFile={changeSelectedFile} />

                            <Content register={register} control={control} errors={errors} territories={territories} allTerritories={allTerritories} selectedTerritories={selectedTerritories} changeSelectedCards={changeSelectedCards} />
                        </form>
                    </motion.div>
                )}
            </div>

            <Footer />
        </div>
    )
}
