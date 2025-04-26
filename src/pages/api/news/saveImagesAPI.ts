"use server";
import fs from "fs";
import path from "path";

export async function saveFile(file: string[] | string | null, imageUrl: string[] | string) {
    try {
        if (file || file !== null) {
            console.log('Saving file')
            if (typeof(file) === "string" && typeof(imageUrl) === "string") {
                const base64Data = file.replace(/^data:.+;base64,/, "");

                const buffer = Buffer.from(base64Data, "base64");

                const filePath = path.join(process.cwd(), "public", imageUrl);

                console.log("File Path:", filePath);
                console.log("File saved:", filePath);

                fs.writeFileSync(filePath, buffer);

            } else {
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
        }
    }catch (error) {
        console.error("Error saving COVER:", error);
    }
}
