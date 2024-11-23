'use server';

import Connect from "@/db/dbConfig";
import jwt from "jsonwebtoken";

export default async function GetAllRequests(req, res) {
    if (req.method === 'GET') {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('Authorization header is missing or invalid');
            return res.status(401).json({ error: 'Unauthorized', redirectUrl: '/' });
        }

        const token = authHeader.split(' ')[1];

        let decoded;

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        }catch (error) {
            console.error("Invalid token:", error);
            return res.status(401).json({ error: 'Unauthorized', redirectUrl: '/' });
        }

        const currentUserRole = decoded.userRole;

        if (currentUserRole === 'admin') {
            const conn = await Connect();
            try {
                const result = await conn.query(`SELECT * FROM chat_room ORDER BY status`);
                res.status(200).json({ result: result.rows })
            }catch (error) {
                console.error("Error getting all requests:", error);
                res.status(500).json({ error: 'fetching data from database' });
            }finally {
                conn.end();
            }
        }

    }else {
        console.error('Method is not allowed');
        res.status(405).json({ error: 'method is not allowed' });
    }
}