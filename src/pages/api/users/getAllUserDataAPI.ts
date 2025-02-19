'use server';
import { NextApiRequest, NextApiResponse } from "next";
import Connect from "@/db/dbConfig";
import jwt from "jsonwebtoken";

export default async function getAllUserData(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('Authorization header is missing or invalid');
            return res.status(401).json({ error: 'Unauthorized' });
        }
    
        const token = authHeader.split(' ')[1];
    
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        }catch ( error ) {
            console.error('Invalid token:', error);
            res.status(401).json({ error: 'Token is not vailed' });
        }
        
        const currentUserId = decoded?.userId;
        
        const conn = await Connect();
        try {
            const result = await conn.query('SELECT * FROM users WHERE id = $1', [currentUserId]);
            return res.status(200).json({ result: result.rows[0] })
        } catch (error) {
            console.error('Error fetching user data:', error);
            res.status(500).json({ error: 'Failed to fetch user data' });
        } finally {
            await conn.end();
        }

    } else {
        console.error('Method is not allowed');
        return res.status(401).end();
    }
}