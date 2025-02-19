"use server";
import fs from "fs";
import path from "path";

export async function saveFile(file: string | any[] | null, imageUrl: string[]) {
    try {
        if (file || file !== null) {
            for (let i = 0; i < file.length; i++) {
                if (file[i] !== null) {
                    const base64Data = file[i].replace(/^data:.+;base64,/, "");
            
                    const buffer = Buffer.from(base64Data, "base64");
            
                    const filePath = path.join(process.cwd(), "public", imageUrl[i]);
                    console.log("File Path:", filePath);
                    console.log("File saved:", filePath);
        
                    fs.writeFileSync(filePath, buffer);
                }else {
                    console.log("File not found");
                    continue;
                }
            }
        }
    }catch (error) {
        console.error("Error saving COVER:", error);
    }
} 