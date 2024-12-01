'use client';

import { Header } from "@/app/components/header";
import { Loader } from "@/app/components/load";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import { saveFile, saveNewsFile } from "@/pages/api/support/sendMessageAPI";

import { K2D } from "next/font/google";
import styles from "@/app/styles/home/variables.module.scss";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

const validationSchema = Yup.object().shape({
    title: Yup.string().required("Please enter a title"),
    description: Yup.string().required("Please enter a description"),
    image: Yup.mixed(),
    paragraph: Yup.array()
        .of(Yup.string()),
    content: Yup.array()
        .of(Yup.string()),
})

export default function CreatePost() {
    const [isloading, setIsLoading] = useState(false);

    const [countOfParagraphs, setCountOfParagraphs] = useState<number>(0);
    const [selectedFiles, setSelectedFiles] = useState([]);

    const [cookies] = useCookies(['auth_token'])
    const router = useRouter();

    const {control, register, handleSubmit, formState: {errors} } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            content: [],
        }
    })

    const { fields: paragraphFields, append: appendParagraph } = useFieldArray({
        control,
        name: "paragraphs",
    })

    const { fields: contentFields, append: appendContent } = useFieldArray({
        control,
        name: "content",
    })

    useEffect(() => {
        if (!cookies.auth_token) {
            router.push('/')
        }
    }, [cookies]);

    const onSubmit = async (data) => {
        console.log(data);

        let filesData = [];
        let fullFileName = [];
        let fileURL = [];
    
        if (selectedFiles && selectedFiles.length > 0) {
            try {
                for (let i = 0; i < selectedFiles.length; i++) {
                    filesData.push(await processFiles(selectedFiles[i]));
                    fullFileName.push(getFile(selectedFiles[i]));
                }
                
                for (let i = 0; i < fullFileName.length; i++) {
                    if (fullFileName[i].length !== 0 ) {
                        const fileName = `${Date.now()}_${fullFileName[i][0].name}.${fullFileName[i][0].extension}`;
                        fileURL.push([`/uploads/news/${fileName}`]);
                    }else {
                        fileURL.push([]);
                    }
                }
    
                try {
                    await saveNewsFile(filesData, fileURL);
                    console.log("Files uploaded successfully");
                } catch (error) {
                    console.error("Failed to upload files");
                    return;
                }
            } catch (error) {
                console.error("Failed to process images");
                return;
            }
        }
    
        try {
            const payload = { 
                data,
                fileUrl: fileURL,
             };
            const response = await fetch(`/api/news/addNewsAPI`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${cookies.auth_token}`,
                },
                body: JSON.stringify(payload),
            });
    
            if (response.ok) {
                console.log("Success");
            } else {
                console.error("Failed to add news");
            }
        } catch (error) {
            console.error(error);
        }
    };
    
    
    const addParagraph = () => {
        setCountOfParagraphs(prevCount => prevCount + 1);
        setSelectedFiles([...selectedFiles, []]);
        appendParagraph('');
        appendContent('');
    };

    const handleFileChange = async (e, index) => {
        const files = e.target.files
        if (files.length > 0) {
            for (let i = 0; i < selectedFiles.length; i++) {
                if (index === i) {
                    const updatedFileList = [...selectedFiles];
                    updatedFileList[i] = Array.from(files);

                    setSelectedFiles(updatedFileList)

                }
            }
        }
        e.target.value = '';
    }

    const processFiles = async (files: FileList): Promise<(string | ArrayBuffer | null)[]> => {
        const filePromises = Array.from(files).map((file) => readFileAsDataURL(file));
    
        try {
            const results = await Promise.all(filePromises);
            return results;
        } catch (error) {
            return [];
        }
    };

    const readFileAsDataURL = (file: file): Promise<string | ArrayBuffer | null> => {
        if (!file) {
            return Promise.resolve([]);
        }

        return new Promise((resolve, rejects) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => rejects(new Error("Error reading file"));
            reader.readAsDataURL(file);
        })
    }

    const getFile = (files) => {
        const fileProperty = [];
        for (let i = 0; i < files.length; i++) {
            const fileName = files[i].name;
            const lastDotIndex = fileName.lastIndexOf(".");
            const name = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
            const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex + 1) : '';
        
            fileProperty[i] = {
                name: name,
                extension: extension,
                size: files[i].size,
            };
        }

        return fileProperty;
    } 

    return (
        <div className={`bg-black text-white `}>
            <form action="" onSubmit={handleSubmit(onSubmit)}>
                <div>

                    <input type="text" {...register("title")} />
                </div>

                <div>

                    <textarea {...register("description")} />
                </div>

                {Array.from({ length: countOfParagraphs }).map((field, index) => (
                    <div key={index}>
                        <input type="text" {...register(`paragraph.${index}`)} placeholder={`Paragraph ${index + 1}`} />
                        <input type="file" {...register(`image.${index}`, {
                            onChange: (e) => {
                                handleFileChange(e, index);
                            }
                        })} />
                        <textarea {...register(`content.${index}`)} placeholder={`content ${index + 1}`} ></textarea>
                    </div>
                ))}

                <div>
                    <button type="button" onClick={addParagraph}>add one more paragraph</button>
                </div>

                <button type="submit">Create post</button>
            </form>
        </div> 
    )
}