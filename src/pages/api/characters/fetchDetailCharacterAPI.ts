"use server";

import { NextApiRequest, NextApiResponse } from "next";
import Connect from "@/db/dbConfig";
import jwt from "jsonwebtoken";

interface JwtPayload {
    userRole: string;
}

export default async function GetDetailCharacter(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const authHeader = req.headers['authorization'];

    let userRole;

    if (authHeader || authHeader?.startsWith('Bearer ')) {

        const token = authHeader?.split(' ')[1];

        if (token !== 'undefined') {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
            userRole = decoded.userRole;
        }
    }

    if (req.method === "GET") {
        const detailID = req.query.characterID;

        const conn = await Connect();
        try {
            const query = `
            SELECT 
                c.*,
                COALESCE(
                    json_agg(t.*) FILTER (WHERE t.id IS NOT NULL),
                    '[]'::json
                ) as territories
            FROM characters c
            LEFT JOIN character_territories ct ON c.id = ct.character_id
            LEFT JOIN universe t ON ct.territory_id = t.id
            WHERE c.id = \$1
            GROUP BY c.id`;

            const result = await conn.query(query, [detailID]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: "Character not found" });
            }
            return res.status(200).json({ data: result.rows, userRole: userRole });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Server error" });
        } finally {
            conn.end();
        }
    }
}
