"use server";
import { NextApiRequest, NextApiResponse } from "next";
import Connect from '@/db/dbConfig';
import jwt from 'jsonwebtoken';

export default async function GetPostData(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { postID } = req.query;
    if (!postID) {
        return res.status(400).json({ error: 'postID is required' });
    }

    let currentUserRole = '';
    const authHeader = req.headers['authorization'];
    const conn = await Connect();

    try {
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];

            if (token && process.env.JWT_SECRET) {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userRole: string };
                    currentUserRole = decoded.userRole;
                } catch (error) {
                    console.error('Invalid token:', error);
                }
            }
        }
        const result = await conn.query(
            `SELECT 
                n.id AS news_id,
                n.title,
                n.description,
                n.add_at,
                n.author,
                COALESCE(json_agg(
                    json_build_object(
                        'block_id', ncb.id,
                        'heading', ncb.heading,
                        'covers', ncb.covers,
                        'vertical_position', ncb.covers_vertical_position,
                        'horizontal_position', ncb.covers_horizontal_position,
                        'content', COALESCE((
                            SELECT json_agg(
                                json_build_object(
                                    'text', nc.content,
                                    'order', nc.order_index,
                                    'image', nc.image
                                )
                            ) 
                            FROM news_content nc 
                            WHERE nc.content_block_id = ncb.id
                        ), '[]'::json)
                    )
                ), '[]'::json) AS content_blocks
            FROM news n
            LEFT JOIN news_content_blocks ncb ON n.id = ncb.news_id
            WHERE n.id = $1
            GROUP BY n.id;`,
            [postID]
        );

        return res.status(200).json({
            result: result.rows[0],
            userRole: currentUserRole || null
        });

    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ error: 'Server error', });
    } finally {
        conn.end();
    }
}