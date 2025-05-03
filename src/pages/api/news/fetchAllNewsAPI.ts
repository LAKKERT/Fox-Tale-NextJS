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
            const result = await conn.query(`SELECT id, title, description, add_at FROM news ORDER BY add_at DESC;`);

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