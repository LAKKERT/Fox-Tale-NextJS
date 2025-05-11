'use client';
import { Loader } from "@/app/components/load";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useCookies } from "react-cookie";
import { useUserStore } from "@/stores/userStore";
import { saveFile } from "@/pages/api/news/saveImagesAPI";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { K2D } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import * as Yup from "yup";
import _ from "lodash";
import { yupResolver } from "@hookform/resolvers/yup";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/supabaseClient";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

interface characterData {
    id: number;
    name: string;
    description: string;
    cover: string;
}

interface territories {
    id: number;
    name: string;
    description: string;
    cover: string;
}

type characterType = {
    cover: File | string;
    name: string;
    description: string;
    territories: number[];
}

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

export function CharacterPageDetailComponent() {
    const params = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const userData = useUserStore((state) => state.userData)
    const [selectedFile, setSelectedFiles] = useState<File | null>();
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isDelete, setIsDelete] = useState(false);
    const [characterData, setCharacterData] = useState<characterData>();
    const [territories, setTerritories] = useState<territories[]>([]);
    const [allTerritories, setAllTerritories] = useState<territories[]>([]);
    const [allUniverses, setAllUniverses] = useState<territories[]>([]);
    const [selectedTerritories, setSelectedTerritories] = useState<number[]>([])

    const [windowSize, setWindowSize] = useState({
        width: typeof window !== "undefined" ? window.innerWidth : 0,
        height: typeof window !== "undefined" ? window.innerHeight : 0,
    });

    const [cookies] = useCookies(['auth_token']);
    const router = useRouter();

    const { control, register, handleSubmit, reset, formState: { errors } } = useForm<characterType>({
        resolver: yupResolver(validationSchema)
    });

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

    const editMode = () => {
        if (isDelete === true) {
            setIsDelete(false);
        } else {
            const value = isEditMode;

            setIsEditMode(!value);
            setSelectedFiles(null);
        }
    }

    const deletePostHandle = () => {
        if (isEditMode === true) {
            setIsDelete(false);
        } else {

            const value = isDelete;

            setIsDelete(!value);
        }
    }

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


    const onSubmit = async (data: characterType) => {
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

    const onDelete = async () => {
        try {
            if (process.env.NEXT_PUBLIC_ENV === 'production') {
                const { error } = await supabase
                    .from('characters')
                    .delete()
                    .eq('id', params?.id)
                if (error) console.error(error)
            } else {
                const response = await fetch(`/api/characters/charactersAPI?characterID=${params?.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${cookies.auth_token}`
                    }
                })

                if (response.ok) {
                    router.push('/characters');
                } else {
                    console.error('error occurred');
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    const selectCardsHandler = (id: number) => {
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
    };

    return (
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

                        <motion.div className={`w-full bg-white`}
                            key={characterData?.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >

                            <div className="relative caret-transparent h-full">
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: .3 }}
                                    className={`uppercase absolute inset-0 text-center text-balance flex items-center justify-center text-white text-xl md:text-7xl tracking-[5px] caret-transparent z-10 ${isEditMode ? 'hidden' : 'block'}`}
                                >
                                    {characterData?.name}
                                </motion.p>

                                <motion.input
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: .3 }}
                                    placeholder="TITLE"
                                    {...register('name')}
                                    className={`absolute uppercase w-full bg-transparent outline-none top-0 bottom-0 my-auto text-white placeholder:text-white text-xl md:text-7xl tracking-[5px] text-center focus:caret-white ${isEditMode ? 'block' : 'hidden'}`}
                                />

                                <Image
                                    src={!selectedFile
                                        ? `http://localhost:3000/${characterData?.cover}`
                                        : URL.createObjectURL(selectedFile)
                                    }
                                    alt="Selected cover"
                                    width={500}
                                    height={300}
                                    className="w-full h-full object-cover"
                                />

                                <input
                                    type="file"
                                    {...register('cover')}
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setSelectedFiles(e.target.files[0]);
                                        }
                                    }}
                                    id="inputFile"
                                    className="hidden"
                                />

                            </div>
                        </motion.div>

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
                                <div className="flex flex-col items-center">
                                    <div className="flex flex-row justify-between mt-2">
                                        {userData?.role === "admin" && (
                                            <div className="flex flex-row gap-3">
                                                <button type="button" onClick={editMode}>EDIT</button>
                                                <button type="button" onClick={deletePostHandle} >DELETE</button>
                                            </div>
                                        )}
                                    </div>

                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: isDelete ? '60px' : '0px', opacity: isDelete ? 1 : 0 }}
                                        transition={{ duration: .3 }}
                                        className={`${userData?.role === 'admin' ? 'block' : 'hidden'}`}
                                    >
                                        <p className={`${isDelete ? 'block' : 'hidde pointer-events-none'}`}>Do you really want to delete this article?</p>
                                        <div className={`flex flex-row justify-center gap-2 ${isDelete ? 'block' : 'hidde pointer-events-none'}`}>
                                            <button type="button" onClick={() => onDelete()}>Yes</button>
                                            <button type="button" onClick={() => setIsDelete(false)} >No</button>
                                        </div>
                                    </motion.div>
                                </div>

                                <motion.div
                                    initial={{ height: 'auto' }}
                                    animate={{
                                        height: isEditMode ? 'auto' : '0',
                                        transition: {
                                            duration: .3,
                                            ease: "easeInOut"
                                        }
                                    }}
                                >
                                    {isEditMode && (
                                        <div className="flex flex-col">
                                            <motion.p
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: errors.name?.message ? 1 : 0, height: errors.name?.message ? 30 : 0 }}
                                                transition={{ duration: .3 }}
                                                className="text-center text-orange-300 text-[13px] sm:text-[18px]"
                                            >
                                                {errors.name?.message}
                                            </motion.p>

                                            <motion.label
                                                htmlFor="inputFile"
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.95,
                                                    y: 10
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    y: 0
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    y: 10
                                                }}
                                                transition={{
                                                    duration: 0.2,
                                                    ease: "easeInOut"
                                                }}
                                                className={`min-w-[185px] max-h-[42px] text-center py-2  px-4 bg-[#C2724F] rounded cursor-pointer select-none border border-[#F5DEB3]`}
                                            >
                                                Change cover
                                            </motion.label>
                                        </div>
                                    )}
                                </motion.div>


                                <motion.div layout={'position'} className="max-w-[640px] w-full h-auto flex flex-col gap-3">
                                    <pre className={`text-lg text-wrap text-[#F5DEB3] px-2 md:px-0 ${isEditMode ? 'hidden' : 'block'}`}>
                                        {characterData?.description}
                                    </pre>
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: errors.description?.message ? 1 : 0, height: errors.description?.message ? 30 : 0 }}
                                        transition={{ duration: .3 }}
                                        className="text-center text-orange-300 text-[13px] sm:text-[18px]"
                                    >
                                        {errors.description?.message}
                                    </motion.p>
                                    <motion.textarea
                                        {...register(`description`)}
                                        onInput={(e) => {
                                            const target = e.target as HTMLTextAreaElement;

                                            target.style.height = "auto";
                                            target.style.minHeight = "50px";
                                            target.style.height = `${target.scrollHeight}px`;
                                        }}
                                        className={` text-left text-lg text-wrap px-2 text-[#F5DEB3] overflow-hidden py-2 w-full border-2 bg-transparent outline-none resize-none rounded border-white focus:border-orange-400 transition-colors duration-300 ${isEditMode ? 'block' : 'hidden'} focus:caret-white`}
                                        style={{
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </motion.div>

                                <div>
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: errors.territories?.message ? 1 : 0, height: errors.territories?.message ? 30 : 0 }}
                                        transition={{ duration: .3 }}
                                        className="text-center text-orange-300 text-[13px] sm:text-[18px]"
                                    >
                                        {errors.territories?.message}
                                    </motion.p>

                                    <Controller
                                        control={control}
                                        name="territories"
                                        defaultValue={selectedTerritories}
                                        render={({ field }) => {
                                            return (
                                                <motion.div layout={'position'} className="flex flex-col items-center gap-4">
                                                    <h2 className="uppercase text-2xl">TERRITORIES</h2>
                                                    <div className="w-full max-w-xl sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl flex flex-wrap justify-center gap-3 ">
                                                        {territories.length > 0 ? (
                                                            territories.map((item) => (
                                                                <motion.div
                                                                    key={item.id}
                                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                                    animate={{
                                                                        opacity: 1,
                                                                        scale: 1,
                                                                        borderColor: isEditMode && selectedTerritories.includes(item.id)
                                                                            ? "#C2724F"
                                                                            : "transparent"
                                                                    }}
                                                                    exit={{ opacity: 0, scale: 0 }}
                                                                    transition={{
                                                                        duration: 0.3,
                                                                        ease: "easeInOut",
                                                                        scale: { type: "spring" }
                                                                    }}
                                                                    whileTap={{ scale: 0.95 }}

                                                                    onClick={() => {
                                                                        if (isEditMode) {
                                                                            const newValue = field.value.includes(item.id)
                                                                                ? field.value.filter(value => value !== item.id)
                                                                                : [...field.value, item.id]
                                                                            selectCardsHandler(item.id)
                                                                            field.onChange(newValue)
                                                                        }
                                                                    }}
                                                                    className={`border-4 rounded-lg flex justify-center gap-3 ${isEditMode ? 'z-10' : 'z-0'}`}
                                                                >
                                                                    <Link href={`/universe/${item.id}`} className={` ${isEditMode ? 'pointer-events-none' : ''} ${isEditMode ? 'z-0' : 'z-10'}`}>
                                                                        <motion.div
                                                                            whileHover='hover'
                                                                            className=" relative w-[250px] h-[345px] rounded shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                                                                        >
                                                                            <Image
                                                                                src={`http://localhost:3000/${item.cover}`}
                                                                                alt="Place Cover"
                                                                                fill
                                                                                sizes="(max-width: 768px) 100vw, 50vw"
                                                                                className="object-cover object-center"
                                                                                quality={100}
                                                                            />

                                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                                <p className="uppercase text-2xl text-white z-10 drop-shadow-lg">
                                                                                    {item.name}
                                                                                </p>
                                                                            </div>

                                                                            <motion.div
                                                                                variants={{ hover: { opacity: 0.3 } }}
                                                                                className="absolute inset-0 bg-black/0"
                                                                            />

                                                                            <motion.div
                                                                                variants={{
                                                                                    hover: {
                                                                                        opacity: 1,
                                                                                        y: 0,
                                                                                        transition: {
                                                                                            duration: 0.3
                                                                                        }
                                                                                    }
                                                                                }}
                                                                                initial={{ opacity: 0, y: 50 }}
                                                                                className="absolute bottom-0 w-full bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4"
                                                                            >
                                                                                <div className="flex w-full items-center justify-between text-white">
                                                                                    <span className="text-lg">Read more</span>
                                                                                    <motion.div
                                                                                        variants={{
                                                                                            hover: { x: 5 },
                                                                                        }}
                                                                                        className="w-6 h-6"
                                                                                    >
                                                                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                                        </svg>
                                                                                    </motion.div>
                                                                                </div>
                                                                            </motion.div>
                                                                        </motion.div>
                                                                    </Link>
                                                                </motion.div>
                                                            ))
                                                        ) : (
                                                            <div>No territories</div>
                                                        )}
                                                    </div>

                                                    <div className={`w-full flex flex-col justify-center  ${isEditMode ? 'block' : 'hidden'}`}>
                                                        <motion.h2
                                                            initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                                            animate={{ opacity: isEditMode ? 1 : 0, y: isEditMode ? -10 : 0, scale: isEditMode ? 1 : 0.98 }}
                                                            transition={{ duration: .3 }}
                                                            className="text-center uppercase text-2xl">ALL TERRITORIES
                                                        </motion.h2>
                                                        <div className="w-full flex flex-wrap justify-center gap-3">
                                                            {allTerritories.length > 0 ? (
                                                                <AnimatePresence mode='popLayout'>
                                                                    {allTerritories.map((item) => (
                                                                        <motion.div
                                                                            key={item.id}
                                                                            initial={{ opacity: 0, scale: 0.5 }}
                                                                            animate={{
                                                                                opacity: 1,
                                                                                scale: 1,
                                                                                borderColor: isEditMode && selectedTerritories.includes(item.id)
                                                                                    ? "#C2724F"
                                                                                    : "transparent"
                                                                            }}
                                                                            exit={{ opacity: 0, scale: 0 }}
                                                                            transition={{
                                                                                duration: 0.3,
                                                                                ease: "easeInOut",
                                                                                scale: { type: "spring" }
                                                                            }}
                                                                            whileTap={{ scale: 0.95 }}
                                                                            onClick={() => {
                                                                                if (isEditMode) {
                                                                                    const newValue = field.value.includes(item.id)
                                                                                        ? field.value.filter(value => value !== item.id)
                                                                                        : [...field.value, item.id]
                                                                                    selectCardsHandler(item.id)
                                                                                    field.onChange(newValue);
                                                                                }
                                                                            }}
                                                                            className={`border-4 rounded-lg flex justify-center gap-3 ${isEditMode ? 'z-10' : 'z-0'}`}
                                                                        >
                                                                            <Link href={`/universe/${item.id}`} className={` ${isEditMode ? 'pointer-events-none' : ''} ${isEditMode ? 'z-0' : 'z-20'}`}>
                                                                                <motion.div
                                                                                    whileHover='hover'
                                                                                    className=" relative w-[250px] h-[345px] rounded shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                                                                                >
                                                                                    <Image
                                                                                        src={`http://localhost:3000/${item.cover}`}
                                                                                        alt="Place Cover"
                                                                                        fill
                                                                                        sizes="(max-width: 768px) 100vw, 50vw"
                                                                                        className="object-cover object-center"
                                                                                        quality={100}
                                                                                    />

                                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                                        <p className="uppercase text-2xl text-white z-10 drop-shadow-lg">
                                                                                            {item.name}
                                                                                        </p>
                                                                                    </div>

                                                                                    <motion.div
                                                                                        variants={{ hover: { opacity: 0.3 } }}
                                                                                        className="absolute inset-0 bg-black/0"
                                                                                    />

                                                                                    <motion.div
                                                                                        variants={{
                                                                                            hover: {
                                                                                                opacity: 1,
                                                                                                y: 0,
                                                                                                transition: {
                                                                                                    duration: 0.3
                                                                                                }
                                                                                            }
                                                                                        }}
                                                                                        initial={{ opacity: 0, y: 50 }}
                                                                                        className="absolute bottom-0 w-full bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4"
                                                                                    >
                                                                                        <div className="flex w-full items-center justify-between text-white">
                                                                                            <span className="text-lg">Read more</span>
                                                                                            <motion.div
                                                                                                variants={{
                                                                                                    hover: { x: 5 },
                                                                                                }}
                                                                                                className="w-6 h-6"
                                                                                            >
                                                                                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                                                </svg>
                                                                                            </motion.div>
                                                                                        </div>
                                                                                    </motion.div>
                                                                                </motion.div>
                                                                            </Link>
                                                                        </motion.div>
                                                                    ))}
                                                                </AnimatePresence>
                                                            ) : (
                                                                <div>No territories available</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )
                                        }}
                                    />
                                </div>


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
    );
}