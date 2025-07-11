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
import { DetailUniverseType } from "@/lib/types/universe";
import { CharacterData } from "@/lib/interfaces/character";
import { Introduction } from "@/app/components/universe/introduction";
import { ToolBar } from "@/app/components/universe/toolBar";
import { Content } from "@/app/components/universe/content";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    description: Yup.string().required('Description is required'),
    cover: Yup.mixed<File | string>().required('Cover is required')
        .test(
            'is-file-or-string',
            'Cover must be a file or string',
            (value) => value instanceof File || typeof value === 'string'
        )
});

export default function UniversePage() {
    const params = useParams()
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFile, setSelectedFiles] = useState<File | null>();
    const [isEditMode, setIsEditMode] = useState(false);
    const [isDelete, setIsDelete] = useState(false);
    const [universeData, setUniverseData] = useState<DetailUniverseType>();
    const [characters, setCharacters] = useState<CharacterData[]>([]);
    const [userRole, setUserRole] = useState<string>('');

    const [windowSize, setWindowSize] = useState({
        width: typeof window !== "undefined" ? window.innerWidth : 0,
        height: typeof window !== "undefined" ? window.innerHeight : 0,
    });

    const [cookies] = useCookies(['auth_token']);
    const router = useRouter();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<DetailUniverseType>({
        resolver: yupResolver(validationSchema)
    });

    const handleRole = (role: string) => {
        setUserRole(role);
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
        const fetchDetailUniverse = async () => {
            if (!params) return

            try {
                const id = params.id;
                if (process.env.NEXT_PUBLIC_ENV === 'production') {
                    const { data: territoryWithChars, error } = await supabase
                        .from('universe')
                        .select(`
                            *,
                            characters (
                            id,
                            name,
                            description,
                            cover
                            )
                        `)
                        .eq('id', params.id)
                        .single();

                    if (error) {
                        console.error(error);
                    } else {
                        const { characters, ...universe } = territoryWithChars;
                        setUniverseData(universe);
                        setCharacters(characters)
                        reset({
                            name: universe.name,
                            description: universe.description,
                            cover: universe.cover
                        })
                        setTimeout(() => {
                            setIsLoading(false)
                        }, 300);
                    }

                } else {
                    const response = await fetch(`/api/universe/fetchDetailUniverseAPI?universeID=${id}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${cookies.auth_token}`
                        }
                    })

                    const result = await response.json();

                    if (response.ok) {
                        setUniverseData(result.data[0])
                        setCharacters(result.data[0].characters)
                        setIsLoading(false);

                        reset({
                            name: result.data[0].name,
                            description: result.data[0].description,
                            cover: result.data[0].cover,
                        })
                    } else {
                        router.push('/universe');
                        console.error('error occurred');
                    }
                }

            } catch (error) {
                console.error(error);
            }
        }

        fetchDetailUniverse();
    }, [router, cookies, params, reset])

    const modeChange = useCallback((editMode: boolean, deleteMode: boolean) => {
        setIsEditMode(editMode);
        setIsDelete(deleteMode);
    }, [])

    const changeCover = useCallback((image: File | null) => {
        setSelectedFiles(image)
    }, [])

    const getFileProperties = async (file: File) => {
        const fullName = file.name;

        const lastDotIndex = fullName.lastIndexOf('.');

        const extension = fullName.substring(lastDotIndex + 1);

        const name = fullName.slice(0, lastDotIndex);

        return `/uploads/universe/${Date.now()}_${name}.${extension}`;
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


    const onSubmit = async (data: DetailUniverseType) => {
        try {
            let fileProperties;

            if (selectedFile) {
                fileProperties = await getFileProperties(selectedFile);

                data.cover = fileProperties

                const fileData = await processFile(selectedFile);

                saveFile(fileData, fileProperties);

            }

            if (process.env.NEXT_PUBLIC_ENV === 'production') {
                const { error } = await supabase
                    .from('universe')
                    .update({
                        name: data.name,
                        description: data.description,
                        cover: data.cover
                    })
                    .eq('id', params?.id)
                if (error) console.error(error);
                else window.location.reload();
            } else {
                const payload = {
                    ...data,
                    universeID: params?.id
                }

                const response = await fetch(`/api/universe/universeAPI`, {
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

    return (
        <div className="w-full min-h-[calc(100vh-100px)] mt-[100px] bg-black object-cover bg-cover bg-center bg-no-repeat overflow-hidden caret-transparent">
            <Header role={handleRole} />
            <div className={`min-h-[calc(100vh-100px)] flex flex-col items-center gap-4 mx-auto ${MainFont.className} text-[#F5DEB3] caret-transparent`}>
                {isLoading ? (
                    <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
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
                        className={`lg:max-w-6xl w-full mx-auto ${MainFont.className} text-white bg-black py-4`}
                    >
                        <form onSubmit={handleSubmit(onSubmit)} key={universeData?.id}>

                            <Introduction register={register} universeData={universeData} selectedFile={selectedFile} isEditMode={isEditMode} changeCover={changeCover} />

                            <ToolBar userRole={userRole} modeChange={modeChange} isDelete={isDelete} isEditMode={isEditMode} params={params} cookies={cookies} router={router} />

                            <AnimatePresence>
                                <Content register={register} isEditMode={isEditMode} errors={errors} universeData={universeData} characters={characters} />
                            </AnimatePresence>
                        </form>
                    </motion.div>
                )}
            </div>
            <Footer />
        </div>
    )
}