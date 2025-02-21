"use server";
import { NextApiRequest, NextApiResponse } from "next";
import Connect from "@/db/dbConfig";
import jwt from "jsonwebtoken";

const normalizeArray = (arr, dimensions: number) => {
    const normalize = (array, currentDepth: number) => {
        if (currentDepth > dimensions) return array;
        if (!Array.isArray(array)) {
            return currentDepth < dimensions ? [array] : array;
        }

        const maxLength = Math.max(...array.map(sub =>
            Array.isArray(sub) ? sub.length : 1
        ));

        return array.map(item => {
            const normalized = Array.isArray(item)
                ? normalize(item, currentDepth + 1)
                : currentDepth < dimensions
                    ? normalize([item], currentDepth + 1)
                    : item;

            if (Array.isArray(normalized)) {
                while (normalized.length < maxLength) {
                    normalized.push(null);
                }
            }
            return normalized;
        });
    };

    return normalize(arr, 1);
};

const formatPGArray = (arr, dimensions: number) => {
    const normalized = normalizeArray(arr, dimensions);

    const escapeElement = (element) => {
        if (element === null) return 'NULL';
        if (Array.isArray(element)) {
            return `{${element.map(escapeElement).join(',')}}`;
        }

        const escaped = String(element)
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"');
        return `"${escaped}"`;
    };

    const formatNested = (array, depth: number) => {
        if (depth < dimensions) {
            return `{${array.map(item =>
                Array.isArray(item)
                    ? formatNested(item, depth + 1)
                    : escapeElement(item)
            ).join(',')}}`;
        }
        return escapeElement(array);
    };

    return formatNested(normalized, 1);
};

export default async function createNewAPI(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {

        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.error('Authorization header is missing or invalid');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(" ")[1];

        let decoded;

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET as string );
        } catch (error) {
            console.error('Invalid token:', error);
            return res.status(403).json({ error: 'Invalid token' });
        }

        const userRole = decoded.userRole;

        if (userRole === "admin") {

            let postID;

            if (req.body.postID) {
                postID = req.body.postID;
            }

            if (req.method === "DELETE") {
                const conn = await Connect();

                try {
                    await conn.query(`DELETE FROM news WHERE id = $1`, [postID]);
                    return res.status(200).json({ redirectUrl: '/news' });
                } catch (error) {
                    console.error("Error deleting post:", error);
                    return res.status(500).json({ message: "Failed to delete post" });
                } finally {
                    await conn.end();
                }
            }

            const { data, userID } = req.body;

            if (!data?.paragraphs || !Array.isArray(data.paragraphs)) {
                return res.status(400).json({ message: "Invalid data structure" });
            }

            const paragraphHeaders: (string | null)[] = [];
            const paragraphCovers: (string | null)[] = [];
            const verticalPosition: (number | null)[] = [];
            const horizontalPosition: (number | null)[] = [];
            const paragraphContents: (string | null)[][] = [];
            const paragraphImages: (string | null)[][] = [];

            data.paragraphs.forEach((paragraph) => {
                paragraphHeaders.push(paragraph.heading || null);
                paragraphCovers.push(paragraph.cover || null);
                verticalPosition.push(paragraph.verticalPosition || null);
                horizontalPosition.push(paragraph.horizontalPosition || null);

                const contentTexts: (string | null)[] = [];
                const contentImages: (string | null)[] = [];
                paragraph.contents.forEach((content) => {
                    contentTexts.push(content.text || null);
                    contentImages.push(content.image || null);
                });

                paragraphContents.push(contentTexts);
                paragraphImages.push(contentImages);
            });

            const conn = await Connect();

            try {
                if (req.method === 'POST') {
                    await conn.query(`
                        INSERT INTO news (
                            title, 
                            description, 
                            add_at, 
                            paragraph_heading, 
                            covers, 
                            images, 
                            content, 
                            author,
                            covers_vertical_position,
                            covers_horizontal_position
                        ) VALUES (
                            $1, $2, NOW(), 
                            $3::text[], 
                            $4::text[], 
                            $5::text[][], 
                            $6::text[][], 
                            $7,
                            $8::numeric[],
                            $9::numeric[]
                        )`,
                        [
                            data.title,
                            data.description || null,
                            formatPGArray(paragraphHeaders, 1),
                            formatPGArray(paragraphCovers, 1),
                            formatPGArray(paragraphImages, 2),
                            formatPGArray(paragraphContents, 2),
                            userID,
                            formatPGArray(verticalPosition, 1),
                            formatPGArray(horizontalPosition, 1)
                        ]
                    );
                    res.status(200).json({ redirectUrl: '/' });
                } else {
                    await conn.query(`
                        UPDATE news SET 
                            title = $1, 
                            description = $2, 
                            paragraph_heading = $3::text[], 
                            covers = $4::text[], 
                            images = $5::text[][], 
                            content = $6::text[][],
                            covers_vertical_position = $7::numeric[],
                            covers_horizontal_position = $8::numeric[]
                        WHERE id = $9`,
                        [
                            data.title,
                            data.description || null,
                            formatPGArray(paragraphHeaders, 1),
                            formatPGArray(paragraphCovers, 1),
                            formatPGArray(paragraphImages, 2),
                            formatPGArray(paragraphContents, 2),
                            formatPGArray(verticalPosition, 1),
                            formatPGArray(horizontalPosition, 1),
                            postID
                        ]
                    );
                    res.status(200).json({ message: "Update successful" });
                }
            } catch (error) {
                console.error("Database error:", error);
                return res.status(500).json({
                    message: "Database operation failed",
                });
            } finally {
                await conn.end();
            }
        } else {
            res.setHeader('Allow', ['POST', 'PUT', 'DELETE']);
            return res.status(405).json({ message: "Method not allowed" });
        }
    }
}