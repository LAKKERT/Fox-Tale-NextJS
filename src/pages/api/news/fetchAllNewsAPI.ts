'use server';
import Connect from '@/db/dbConfig';
import { NextApiRequest, NextApiResponse } from "next";
import jwt from 'jsonwebtoken'

interface JwtPayload {
    userRole: string;
}

export default async function GetAllNews(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {

        const authHeader = req.headers['authorization'];

        let userRole;

        if (authHeader || authHeader?.startsWith('Bearer ')) {

            const token = authHeader?.split(' ')[1];

            if (token !== 'undefined') {
                const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
                userRole = decoded.userRole;
            }
        }

        const conn = await Connect();

        try {
            const result = await conn.query(`
                SELECT 
                    n.id AS news_id,
                    n.title,
                    n.description,
                    n.add_at,
                    COALESCE(json_agg(
                        json_build_object(
                            'content', (
                                SELECT COALESCE(json_agg(
                                    json_build_object(
                                        'text', nc.content
                                    ) ORDER BY nc.order_index
                                ), '[]')
                                FROM news_content nc 
                                WHERE nc.content_block_id = ncb.id
                            )
                        ) ORDER BY ncb.content_block_order_index
                    ), '[]') AS content_blocks
                FROM news n
                LEFT JOIN news_content_blocks ncb ON n.id = ncb.news_id
                GROUP BY n.id
                ORDER BY n.add_at DESC;`);

            return res.status(200).json({ result: result.rows, userRole: userRole });
        } catch (errors) {
            return res.status(500).json({ errors: errors });
        } finally {
            conn.end();
        }
    } else {
        console.error("Method not supported");
        return res.status(405).json({ errors: 'Method not supported' });
    }
}