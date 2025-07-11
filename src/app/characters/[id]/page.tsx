'use client';
import { Header } from "@/app/components/header";
import { Footer } from "@/app/components/footer";
import { Loader } from "@/app/components/load";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useCookies } from "react-cookie";
import { saveFile } from "@/pages/api/news/saveImagesAPI";
import { useRouter } from "next/navigation";
import { K2D } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import * as Yup from "yup";
import _ from "lodash";
import { yupResolver } from "@hookform/resolvers/yup";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/supabaseClient";
import { CharacterDetailData, CharacterInputData } from "@/lib/interfaces/character"
import { UniverseType } from "@/lib/interfaces/universe";
import { Introduction } from "@/app/components/characters/introduction";
import { ToolBar } from "@/app/components/characters/toolBar";
import { Content } from "@/app/components/characters/content";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

const validationSchema = Yup.object().shape({
    cover: Yup.mixed<File | string>()
        .test("required", "Cover must be a file or URL string", (value) => {
            if (!value) {
                return false;
            }

            return (
                value instanceof File ||
                (typeof value === "string")
            )
        })
        .required(),
    name: Yup.string().required("Name is required"),
    description: Yup.string().required("Description is required"),
    territories: Yup.array()
        .of(Yup.number().required())
        .min(1, "Select at least one territory")
        .required("Territories are required")
})


export default function UniversePage() {
    const params = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFile, setSelectedFiles] = useState<File | null>();
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isDelete, setIsDelete] = useState(false);
    const [characterData, setCharacterData] = useState<CharacterDetailData>();
    const [territories, setTerritories] = useState<UniverseType[]>([]);
    const [allTerritories, setAllTerritories] = useState<UniverseType[]>([]);
    const [allUniverses, setAllUniverses] = useState<UniverseType[]>([]);
    const [selectedTerritories, setSelectedTerritories] = useState<number[]>([])
    const [userRole, setUserRole] = useState<string>();

    const [windowSize, setWindowSize] = useState({
        width: typeof window !== "undefined" ? window.innerWidth : 0,
        height: typeof window !== "undefined" ? window.innerHeight : 0,
    });

    const [cookies] = useCookies(['auth_token']);
    const router = useRouter();

    const { control, register, handleSubmit, reset, formState: { errors } } = useForm<CharacterInputData>({
        resolver: yupResolver(validationSchema)
    });


    const handleRole = (role: string) => {
        setUserRole(role)
    }

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const updateTextareas = () => {
            document.querySelectorAll('textarea').forEach(textarea => {
                textarea.style.height = "auto";
                textarea.style.height = `${textarea.scrollHeight}px`;
            });
        };

        updateTextareas();

        const resizeObserver = new ResizeObserver(_.debounce(updateTextareas, 100));

        const container = document.querySelector('.your-container-class');
        if (container) resizeObserver.observe(container);

        return () => resizeObserver.disconnect();
    }, [windowSize, isEditMode]);

    useEffect(() => {
        const fetchDetailCharacter = async () => {
            if (!params) return;
            try {
                if (process.env.NEXT_PUBLIC_ENV === 'production') {
                    const { data: characterData, error } = await supabase
                        .from('characters')
                        .select(`
                                id,
                                name,
                                description,
                                cover,
                                territories:character_territories!inner(
                                universe:territory_id(
                                    id,
                                    name,
                                    description,
                                    cover
                                )
                                )
                            `)
                        .eq('id', params?.id)
                        .single();

                    if (error) {
                        console.error('Ошибка загрузки персонажа:', error);
                        return;
                    } else {
                        const formattedData = {
                            ...characterData,
                            territories: characterData.territories.map(t => t.universe).flat()
                        };
                        reset({
                            name: formattedData.name,
                            description: formattedData.description,
                            cover: formattedData.cover
                        })
                        setCharacterData(formattedData);
                        setTerritories(formattedData.territories);
                        setSelectedTerritories(formattedData.territories.map((item: { id: number }) => item.id));

                        setIsLoading(false);
                    }

                } else {
                    const response = await fetch(`/api/characters/fetchDetailCharacterAPI?characterID=${params.id}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${cookies.auth_token}`
                        }
                    })

                    const result = await response.json();

                    if (response.ok) {
                        setCharacterData(result.data[0]);
                        setTerritories(result.data[0].territories);
                        setSelectedTerritories(result.data[0].territories.map((item: { id: number }) => item.id));
                        setIsLoading(false);

                        reset({
                            name: result.data[0].name,
                            description: result.data[0].description,
                            cover: result.data[0].cover,
                        })
                    } else {
                        router.push('/characters');
                        console.error('error occurred');
                    }
                }
            } catch (error) {
                console.error(error);
            }
        }

        fetchDetailCharacter();
    }, [router, cookies, params, reset])

    useEffect(() => {
        const fecthAllUniverses = async () => {
            try {
                if (process.env.NEXT_PUBLIC_ENV === 'production') {
                    const { data, error } = await supabase
                        .from('universe')
                        .select('*')
                    if (error) {
                        console.error(error);
                    } else {
                        const cleanedTer = data.filter((item) => !selectedTerritories.includes(item.id))
                        setAllTerritories(cleanedTer)
                        setAllUniverses(data)
                    }
                } else {
                    const response = await fetch(`/api/universe/fetchUniverseData`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    })

                    const result = await response.json();

                    const cleanedData = result.data.filter((item: { id: number }) =>
                        !selectedTerritories.includes(item.id)
                    );

                    if (response.ok) {
                        setAllUniverses(result.data)
                        setAllTerritories(cleanedData);
                    } else {
                        console.error('error occurred');
                    }
                }
            } catch (error) {
                console.error(error);
            }
        }

        if (isEditMode) {
            fecthAllUniverses()
        }

    }, [isEditMode, selectedTerritories])

    const getFileProperties = async (file: File) => {
        const fullName = file.name;

        const lastDotIndex = fullName.lastIndexOf('.');

        const extension = fullName.substring(lastDotIndex + 1);

        const name = fullName.slice(0, lastDotIndex);

        return `/uploads/characters/${Date.now()}_${name}.${extension}`;
    }

    const processFile = async (file: File | null | undefined): Promise<string | null> => {
        if (!file || !(file instanceof File)) {
            console.error('Invalid file provided');
            return null;
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject;
            reader.readAsDataURL(file);
        });
    }


    const onSubmit = async (data: CharacterInputData) => {
        try {
            let fileProperties;

            if (selectedFile) {
                fileProperties = await getFileProperties(selectedFile);

                data.cover = fileProperties

                const fileData = await processFile(selectedFile);

                saveFile(fileData, fileProperties);

            }

            data.territories = selectedTerritories

            if (process.env.NEXT_PUBLIC_ENV === 'production') {
                const { error } = await supabase
                    .from('characters')
                    .update({
                        name: data.name,
                        description: data.description,
                        cover: data.cover
                    })
                    .eq('id', params?.id)

                if (error) {
                    console.error(error)
                } else {
                    const { error: deleteTerritories } = await supabase
                        .from('character_territories')
                        .delete()
                        .eq('character_id', params?.id);

                    if (deleteTerritories) {
                        console.error(error);
                    } else {
                        for (const item of data.territories) {
                            const { error } = await supabase
                                .from('character_territories')
                                .insert({
                                    character_id: params?.id,
                                    territory_id: item
                                });
                            if (error) {
                                console.error(error);
                            } else {
                                window.location.reload();
                            }
                        }
                    }
                }
            } else {
                const payload = {
                    ...data,
                    characterID: params?.id
                }

                const response = await fetch(`/api/characters/charactersAPI`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${cookies.auth_token}`
                    },
                    body: JSON.stringify(payload)
                })

                if (response.ok) {
                    location.reload()
                } else {
                    console.error('error occurred');
                }
            }
        } catch (error) {
            console.error(error);
        }
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

    const modeChange = useCallback((editMode: boolean, deleteMode: boolean) => {
        setIsEditMode(editMode);
        setIsDelete(deleteMode);
    }, []);

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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`lg:max-w-6xl w-full mx-auto ${MainFont.className} text-white bg-black py-4 `}
                    >
                        <form onSubmit={handleSubmit(onSubmit)}>

                            <Introduction register={register} characterData={characterData} selectedFile={selectedFile} isEditMode={isEditMode} changeSelectedFile={changeSelectedFile} />

                            <AnimatePresence>
                                <motion.div
                                    layout
                                    animate={{
                                        gap: isEditMode ? '16px' : '0px',
                                        transitionEnd: {
                                            gap: isEditMode ? "16px" : '0'
                                        }
                                    }}

                                    className="w-full flex flex-col items-center"
                                    transition={{
                                        duration: .3,
                                        ease: "easeInOut"
                                    }}

                                >
                                    <ToolBar userRole={userRole} isEditMode={isEditMode} isDelete={isDelete} router={router} params={params} cookies={cookies} modeChange={modeChange} />

                                    <Content register={register} control={control} selectedTerritories={selectedTerritories} territories={territories} errors={errors} allTerritories={allTerritories} isEditMode={isEditMode} characterData={characterData} changeSelectedCards={changeSelectedCards} />

                                    <motion.button
                                        layout
                                        initial={{
                                            opacity: 0,
                                            y: -10,
                                            scale: 0.98
                                        }}

                                        animate={{
                                            opacity: isEditMode ? 1 : 0,
                                            y: isEditMode ? 0 : -10,
                                            scale: isEditMode ? 1 : 0.98,
                                            display: isEditMode ? "inline-block" : "none",
                                            transition: {
                                                duration: 0.3,
                                                ease: "easeInOut"
                                            },
                                            transitionEnd: {
                                                display: isEditMode ? "inline-block" : "none",
                                            },
                                        }}

                                        transition={{
                                            layout: {
                                                duration: 0.3,
                                                ease: "easeInOut"
                                            }
                                        }}
                                        type="submit" className={`px-6 py-2 bg-green-500 rounded`}>
                                        SAVE CHANGES
                                    </motion.button>
                                </motion.div>
                            </AnimatePresence>
                        </form>
                    </motion.div>
                )}
            </div>
            <Footer />
        </div>
    )
}