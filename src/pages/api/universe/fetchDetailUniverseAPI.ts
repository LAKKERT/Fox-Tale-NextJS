'use server';

import { NextApiRequest, NextApiResponse } from "next";
import Connect from "@/db/dbConfig";
import jwt from "jsonwebtoken";

interface JwtPayload {
    userRole: string;
}

export default async function GetDetailUniverse(req: NextApiRequest, res: NextApiResponse) {

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
        const detailID = req.query.universeID;

        const conn = await Connect();
        try {
            const query = `
            SELECT 
                u.*,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', c.id,
                            'name', c.name,
                            'description', c.description,
                            'cover', c.cover
                        )
                    ) FILTER (WHERE c.id IS NOT NULL),
                    '[]'::json
                ) as characters
            FROM universe u
            LEFT JOIN character_territories ct ON u.id = ct.territory_id
            LEFT JOIN characters c ON ct.character_id = c.id
            WHERE u.id = \$1
            GROUP BY u.id`

            const result = await conn.query(query, [detailID]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: "Universe not found" });
            }
            return res.status(200).json({ data: result.rows, userRole: userRole })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Server error" });
        } finally {
            conn.end();
        }
    }
}