'use server';
import Connect from '@/db/dbConfig';
import { NextApiRequest, NextApiResponse } from "next";

export default async function GetAllNews(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const conn = await Connect();
        try {
            const result = await conn.query(`SELECT id, title, description, add_at, content FROM news ORDER BY add_at DESC;`);
            res.status(200).json({ result: result.rows });
        }catch (errors) {
            res.status(500).json({ errors: errors });
        }finally {
            conn.end();
        }
    }else {
        console.error("Method not supported");
        res.status(405).json({ errors: 'Method not supported' });
    }
}