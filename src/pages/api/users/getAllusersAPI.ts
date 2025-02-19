'use server';
import { NextApiRequest, NextApiResponse } from "next";
import Connect from "@/db/dbConfig";
import jwt from "jsonwebtoken";

export default async function getAllUsers(req: NextApiRequest, res: NextApiResponse) {
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
        } catch ( error ) {
            console.error('Invalid token', error);
            return res.status(403).json({ error: 'Token is not vailed' });
        }
        
        const currentUserRole = decoded.userRole;
        
        if (currentUserRole === 'admin') {
            const conn = await Connect();
            
            try {
                const result = await conn.query('SELECT * FROM users');
                res.status(200).json( { result: result.rows } );
            }catch ( error ) {
                console.error('Failed to connect to the database', error);
                return res.status(500).json({ error: 'Failed to connect to the database' });
            }finally {
                await conn.end();
            }

        }


    } else {
        console.error('Method is not allowed');
        return res.status(401).end();
    }
}