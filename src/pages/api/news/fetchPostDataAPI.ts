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
    let conn;

    try {
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            
            if (token && process.env.JWT_SECRET) {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userRole: string };
                    currentUserRole = decoded.userRole;
                } catch (error) {
                    console.error('Invalid token:', error.message);
                }
            }
        }

        conn = await Connect();
        const result = await conn.query(
            `SELECT * FROM news WHERE id = $1`,
            [postID]
        );

        return res.status(200).json({ 
            result: result.rows,
            userRole: currentUserRole || null 
        });

    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ error: 'Server error',});
    } finally {
        conn.end();
    }
}