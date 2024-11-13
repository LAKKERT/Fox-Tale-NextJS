"use server";
import Connect from "@/db/dbConfig";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

export async function saveMessageToDB(content: any, roomID: any, userID: any, file_url: any) {
    const conn = await Connect();

    try {
        await conn.query(
            'INSERT INTO messages (room_id, user_id, message, sent_at, file_url) VALUES ($1, $2, $3, NOW(), $4)',
            [roomID, userID, content, file_url ]
        );
    } catch (errors) {
        console.error("Error saving message to DB:", errors);
    } finally {
        await conn.end();
    }
}

export async function saveFile(file: string | any[] | null, imageUrl: string[]) {
    try {
        if (file) {
            for (let i = 0; i < file.length; i++) {
                const base64Data = file[i].replace(/^data:.+;base64,/, "");
        
                const buffer = Buffer.from(base64Data, "base64");
        
                const filePath = path.join(process.cwd(), "public", imageUrl[i]);
                console.log("File Path:", filePath);
                console.log("File saved:", filePath);
    
                fs.writeFileSync(filePath, buffer);
            }
        }
    }catch (error) {
        console.error("Error saving file:", error);
    }
} 
