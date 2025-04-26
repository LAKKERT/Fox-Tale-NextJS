'use server';
import Connect from '@/db/dbConfig';
import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from "next";

interface JwtPayload {
    userRole: string;
}

export default async function closeChat(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { roomID, cookies } = req.body;

        if (!roomID) {
            console.error('Missing roomID');
            return res.status(400).json({ error: 'roomID is required' });
        }
    
        if (!cookies) {
            console.error('Missing cookies');
            return res.status(401).json({ error: 'Unauthorized' });
        }
    
        let decoded;
        try {
            decoded = jwt.verify(cookies, process.env.JWT_SECRET as string) as JwtPayload;
        } catch (error) {
            console.error('Invalid token:', error);
            return res.status(401).json({ error: 'Invalid token' });
        }
    
        if (decoded.userRole !== 'admin') {
            console.error('Permission denied: not an admin');
            return res.status(403).json({ error: 'Permission denied' });
        }
    
        const conn = await Connect();
    
        try {
            await conn.query(`UPDATE chat_room SET status = 'true' WHERE id = $1`, [roomID]);
            return res.status(200).json({ message: 'Chat room closed successfully' });
        } catch (error) {
            console.error('Error closing chat room:', error);
            return res.status(500).json({ error: 'Internal server error' });
        } finally {
            await conn.end();
        }
    } else {
        console.error('Method is not allowed');
        res.status(405).end();
    }
}