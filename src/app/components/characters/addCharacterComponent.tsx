'use client';
import { Loader } from "@/app/components/load";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { saveFile } from "@/pages/api/news/saveImagesAPI";
import Image from "next/image";
import { K2D } from "next/font/google";
import { PT_Serif } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";


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

type characterType = {
    cover: File
    name: string;
    description: string;
    territories: number[];
}

interface fileProperty {
    name: string;
    type: string;
    size: number;
}

interface territories {
    id: number;
    name: string;
    cover: string;
}

const validationSchema = Yup.object().shape({
    cover: Yup.mixed().required("Cover is required"),
    name: Yup.string().required("Name is required"),
    description: Yup.string().required("Description is required"),
})

const cardAnimation = {
    tap: { scale: 0.8 },
}

export function AddCharacter() {
    const [isLoading, setIsLoading] = useState(true);

    const [selectedFile, setSelectedFiles] = useState<File | null>();
    const [selectedTerritories, setSelectedTerritories] = useState<number[]>([]);
    const [territories, setTerritories] = useState<territories[]>([]);
    const [allTerritories, setAllTerritories] = useState<territories[]>([]);
    const [allUniverses, setAllUniverses] = useState<territories[]>([]);

    const [cookies] = useCookies(['auth_token']);
    const router = useRouter();

    const { register, handleSubmit, formState: { errors } } = useForm<characterType>({
        resolver: yupResolver(validationSchema)
    })

    useEffect(() => {

        if (!cookies || !cookies.auth_token) {
            return router.push('/');
        }

        const checkUserRole = async () => {
            try {
                const response = await fetch('/api/fetchUserRoleAPI', {
                    headers: {
                        'Authorization': `Bearer ${cookies.auth_token}`,
                    }
                })

                const result = await response.json();

                if (result.userRole !== 'admin') {
                    router.push(result.redirectUrl);
                }
            } catch (error) {
                console.error('Error fetching user role:', error);
            }
        }

        const getTerritories = async () => {
            try {
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

            } catch (error) {
                console.error('Error fetching territories:', error);
            }
        }

        checkUserRole();
        getTerritories()
    }, [cookies, router]);

    console.log(territories)

    const onSubmit = async (data: characterType) => {
        try {
            const fileProperty = filesProperties(selectedFile);
            const fileData = await processFile(selectedFile)

            saveFile(fileData, fileProperty)

            data.territories = selectedTerritories;

            const payload = {
                ...data,
                coverName: fileProperty
            }

            const response = await fetch(`/api/characters/charactersAPI`, {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                    'Authorization': `Bearer ${cookies.auth_token}`
                },
                body: JSON.stringify(payload),
            })

            if (response.ok) {
                router.push(`/characters`);
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

        const fullFileName = `/uploads/characters/${Date.now()}_${name}.${extension}`;

        return fullFileName;
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
                                        className={`absolute w-full bg-transparent outline-none top-0 bottom-0 my-auto text-white placeholder:text-white text-xl md:text-4xl tracking-[5px] text-center caret-white ${introductionFont.className}`}
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
                                    }
                                }}
                                id="inputFile"
                                className="hidden"
                            />

                            <label htmlFor="inputFile"
                                className={` min-w-[185px] text-center py-2 mt-3 px-4 bg-[#C2724F] rounded cursor-pointer select-none border border-[#F5DEB3] transition-colors duration-75 hover:bg-[#c2724f91]`}
                            >
                                {selectedFile ? 'Change cover' : 'Upload cover'}
                            </label>

                            <div className="max-w-[640px] w-full h-auto flex flex-col gap-3 px-2 md:px-0">
                                <textarea
                                    {...register('description')}
                                    onInput={(e) => {
                                        const target = e.target as HTMLTextAreaElement;

                                        target.style.height = "auto";
                                        target.style.minHeight = "50px";
                                        target.style.height = `${target.scrollHeight}px`;
                                    }}
                                    className={`text-left text-sm md:text-base text-balance text-[#F5DEB3] overflow-hidden p-2 w-full border-2 bg-transparent outline-none resize-none rounded border-white focus:border-orange-400 transition-colors duration-300 caret-white`}
                                    style={{
                                        boxSizing: "border-box"
                                    }}
                                    placeholder="DESCRIPTION"
                                >
                                </textarea>
                            </div>

                            <motion.div className="flex flex-col items-center gap-3">
                                <h2 className="uppercase text-2xl">TERRITORIES</h2>
                                <div className="w-full max-w-xl sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl flex flex-wrap justify-center gap-3 ">
                                    {territories ? (
                                        territories.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    borderColor: selectedTerritories.includes(item.id)
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
                                                onClick={() => selectCardsHandler(item.id)}
                                                className={`border-4 rounded-lg flex justify-center gap-3 `}
                                            >

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

                                                    
                                                </motion.div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div>No territories</div>
                                    )}
                                </div>

                                <div className={`w-full flex flex-col justify-center gap-3 `}>
                                    <h2 className="text-center uppercase text-2xl">ALL TERRITORIES</h2>
                                    <div className="w-full flex flex-wrap justify-center gap-3">
                                        {allTerritories ? (
                                            <AnimatePresence mode='popLayout'>
                                                {allTerritories.map((item) => (
                                                    <motion.div
                                                        key={item.id}
                                                        initial={{ opacity: 0, scale: 0.5 }}
                                                        animate={{
                                                            opacity: 1,
                                                            scale: 1,
                                                            borderColor: selectedTerritories.includes(item.id)
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
                                                        onClick={() => selectCardsHandler(item.id)}
                                                        className={`border-4 rounded-lg flex justify-center gap-3`}
                                                    >

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
                                                        </motion.div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        ) : (
                                            <div>No territories available</div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

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
