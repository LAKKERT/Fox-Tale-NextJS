"use server";

import Connect from "@/db/dbConfig";
import fs from "fs";
import path from "path";

export async function saveMessageToDB(content: string, roomID: string, userID: string, file_url: string[]) {
    const conn = await Connect();

    try {
        await conn.query(
            'INSERT INTO messages (room_id, user_id, message, sent_at, file_url) VALUES ($1, $2, $3, NOW(), $4)',
            [roomID, userID, content, file_url]
        );
    } catch (errors) {
        console.error("Error saving message to DB:", errors);
    } finally {
        await conn.end();
    }
}

export async function saveFile(file: (string | ArrayBuffer | null)[] | null, imageUrl: string[]) {
    try {
        if (!file) return;

        for (let i = 0; i < file.length; i++) {
            const currentFile = file[i];
            if (typeof currentFile === 'string') {
                const base64Data = currentFile.replace(/^data:.+;base64,/, "");
                const buffer = Buffer.from(base64Data, "base64");

                const filePath = path.join(process.cwd(), "public", imageUrl[i] || `image_${i}.png`);
                console.log("File Path:", filePath);
                console.log("File saved:", filePath);

                fs.writeFileSync(filePath, buffer);
            } else {
                console.log("Skipping non-string file entry:", currentFile);
            }
        }
    } catch (error) {
        console.error("Error saving file:", error);
    }
}

export async function saveNewsFile(files: (string | ArrayBuffer | null)[] | null, imageUrls: string[]) {
    try {
        if (!files || !imageUrls) return;

        for (let i = 0; i < files.length; i++) {
            const group = files[i];
            const urlGroup = imageUrls[i];

            if (Array.isArray(group)) {
                for (let j = 0; j < group.length; j++) {
                    const fileContent = group[j];

                    if (typeof fileContent === 'string') {
                        const base64Data = fileContent.replace(/^data:.+;base64,/, "");
                        const buffer = Buffer.from(base64Data, "base64");

                        if (Array.isArray(urlGroup) && urlGroup[j]) {
                            const filePath = path.join(process.cwd(), "public", urlGroup[j]);
                            console.log("File Path:", filePath);
                            console.log("File saved:", filePath);

                            fs.writeFileSync(filePath, buffer);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error saving file:", error);
    }
}