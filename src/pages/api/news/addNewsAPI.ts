"use server";
import { NextApiRequest, NextApiResponse } from "next";
import Connect from "@/db/dbConfig";
import jwt from "jsonwebtoken";
import { ContentBlock, TextContent } from "@/lib/types/news";

interface JwtPayload {
    userRole: string;
    userId: string;
}

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
            decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        } catch (error) {
            console.error('Invalid token:', error);
            return res.status(403).json({ error: 'Invalid token' });
        }

        const userRole = decoded.userRole;

        if (userRole === "admin") {

            if (req.method === "POST") {
                const { data, userID } = req.body;
                const conn = await Connect();

                try {
                    const createPost = await conn.query(`INSERT INTO news (title, description, add_at, author) VALUES ($1, $2, NOW(), $3) RETURNING id`, [
                        data.title,
                        data.description,
                        userID,
                    ])

                    const postID = createPost.rows[0].id

                    const contentBlockValues = data.content_blocks.map((item: ContentBlock) => [
                        item.heading,
                        item.covers,
                        postID,
                        item.order_index,
                        item.vertical_position,
                        item.horizontal_position
                    ]).flat();

                    const contentBlockParams = Array.from({ length: data.content_blocks.length }, (_, i) =>
                        `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`
                    ).join(', ');

                    const createContentQuery = `
                    INSERT INTO news_content_blocks 
                        (heading, covers, news_id, content_block_order_index, covers_vertical_position, covers_horizontal_position)
                    VALUES ${contentBlockParams} RETURNING id`;

                    const createContentBlock = await conn.query(createContentQuery, contentBlockValues);

                    const contentBlocksID = createContentBlock.rows;

                    const contentValues: TextContent[] = [];

                    data.content_blocks.map((p: ContentBlock, index: number) => {
                        const contentItem = p.content.map((item) => [
                            item.content,
                            contentBlocksID[index].id,
                            item.order_index,
                            item.image
                        ]).flat();

                        contentValues.push(...contentItem);
                    });

                    const flatContentValues = contentValues;

                    const ContentParams = Array.from({ length: contentValues.length / 4 }, (_, i) =>
                        `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`
                    ).join(', ');

                    const createTextContentQuery = `
                    INSERT INTO news_content (content, content_block_id, order_index, image) VALUES ${ContentParams}`;

                    await conn.query(createTextContentQuery, flatContentValues);

                    return res.status(200).json({ message: "Post created successfully" });

                } catch (error) {
                    console.error("Database error:", error);
                    return res.status(500).json({
                        message: "Database operation failed",
                    });
                } finally {
                    await conn.end();
                }
            } else if (req.method === "DELETE") {
                const postID = req.body;

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
            } else if (req.method === "PUT") {
                const { data, postID } = req.body;

                for (let i = 0; i < data.content_blocks.length; i++) {
                    delete data.content_blocks[i].id;
                }

                const conn = await Connect();

                try {
                    await conn.query('BEGIN');

                    await conn.query(
                        `UPDATE news 
                         SET title = \$1, description = \$2
                         WHERE id = \$3`,
                        [data.title, data.description, postID]
                    );

                    await conn.query(
                        `DELETE FROM news_content_blocks 
                        WHERE news_id = \$1`,
                        [postID]
                    );

                    if (data.content_blocks?.length > 0) {
                        const contentBlocks = await conn.query(
                            `INSERT INTO news_content_blocks 
                            (heading, covers, news_id, content_block_order_index, covers_vertical_position, covers_horizontal_position)
                            VALUES ${data.content_blocks.map((_, i: number) =>
                                `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`
                            ).join(', ')} RETURNING id`,
                            data.content_blocks.flatMap((p: ContentBlock) => [
                                p.heading,
                                p.covers,
                                postID,
                                p.order_index,
                                p.vertical_position,
                                p.horizontal_position
                            ])
                        );

                        const contentValues = [];

                        for (const [idx, p] of data.content_blocks.entries()) {
                            const blockId = contentBlocks.rows[idx].id;

                            for (const content of p.content) {
                                contentValues.push(content.text, blockId, content.order_index, content.image);
                            }
                        }

                        if (contentValues.length > 0) {
                            const contentParamPlaceholders = Array.from({ length: contentValues.length / 4 }, (_, i) =>
                                `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`
                            ).join(', ');

                            await conn.query(
                                `INSERT INTO news_content (content, content_block_id, order_index, image)
                                 VALUES ${contentParamPlaceholders}`,
                                contentValues
                            );
                        }
                    }

                    await conn.query('COMMIT');
                    return res.status(200).json({ success: true, postId: postID });

                } catch (error) {
                    await conn.query('ROLLBACK');
                    console.error("Update error:", error);
                    return res.status(500).json({ message: "Update failed" });
                } finally {
                    conn.end();
                }
            }

        } else {
            res.setHeader('Allow', ['POST', 'PUT', 'DELETE']);
            return res.status(405).json({ message: "Method not allowed" });
        }
    }
}