'use server';
import { NextApiRequest, NextApiResponse } from "next";
import Connect from "@/db/dbConfig";
import jwt from "jsonwebtoken";

interface JwtPayload {
    userId: number;
}

export default async function GetAllRequests(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('Authorization header is missing or invalid');
            return res.status(401).json({ error: 'Unauthorized', redirectUrl: '/' });
        }

        const token = authHeader.split(' ')[1];

        let decoded;

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        } catch (error) {
            console.error("Invalid token:", error);
            return res.status(401).json({ error: 'Unauthorized', redirectUrl: '/' });
        }

        const currentUserId = decoded.userId;

        const conn = await Connect();
        try {
            const result = await conn.query(`SELECT * FROM chat_room WHERE author = $1`, [currentUserId]);
            res.status(200).json({ result: result.rows })
        } catch (error) {
            console.error("Error getting all requests:", error);
            res.status(500).json({ error: 'fetching data from database' });
        } finally {
            conn.end();
        }


    } else {
        console.error('Method is not allowed');
        res.status(405).json({ error: 'method is not allowed' });
    }
}