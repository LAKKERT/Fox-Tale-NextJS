"use server";

import Connect from "@/db/dbConfig";
import jwt from "jsonwebtoken";

export default async function createNewAPI(req, res) {
    if (req.method === "POST") {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        
        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        }catch (error) {
            return res.status(403).json({ message: "Invalid token" });
        }
        
        const currentUserID = decoded.userId;
        
        const { data, fileUrl } = req.body;

        const cleanedFileUrls = fileUrl.map(url => (url.length === 0 ? "" : url[0]));

        if (!Array.isArray(cleanedFileUrls)) {
            return res.status(400).json({ message: "Invalid fileUrl format, expected an array" });
        }

        const conn = await Connect();
        
        try {
            await conn.query(
                `INSERT INTO news (title, description, add_at, paragraph_heading, content, images, author) 
                VALUES ($1, $2, NOW(), $3, $4, $5::text[], $6)`,
                [data.title, data.description, data.paragraph, data.content, cleanedFileUrls, currentUserID]
            );
            return res.status(200).json({redirectURL: '/'})
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal Server Error" });
        }finally {
            await conn.end()
        }


    } else {
        return res.status(405).json({ message: "Method not allowed" });
    }
}