"use server";
import { NextApiRequest, NextApiResponse } from "next";
import Connect from '@/db/dbConfig';
import jwt from 'jsonwebtoken';

export default async function GetPostData(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {

        const authHeader = req.headers['authorization'];

        let currentUserRole = '';

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('Authorization header is missing or invalid');
            currentUserRole = '';
        }

        const token = authHeader.split(' ')[1];

        let decoded;

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET as string);
            currentUserRole = decoded.userRole;
        } catch (error) {
            console.error('Invalid token', error);
            currentUserRole = '';
        }

        const { postID } = req.query;

        const conn = await Connect();
        try {
            const result = await conn.query(`SELECT * FROM news WHERE id = $1`, [postID]);
            return res.status(200).json({ result: result.rows, userRole: currentUserRole });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Error retrieving data' });
        } finally {
            conn.end();
        }
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}
