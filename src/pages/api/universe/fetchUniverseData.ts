'use server'

import { NextApiRequest, NextApiResponse } from "next";
import Connect from "@/db/dbConfig";
import jwt from "jsonwebtoken";

interface JwtPayload {
    userRole: string;
}

export default async function fetchUniverse(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {

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
            const result = await conn.query(`SELECT * FROM universe`);
            return res.status(200).json({ data: result.rows, userRole: userRole });
        }catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }finally {
            await conn.end();
        }
    }
}