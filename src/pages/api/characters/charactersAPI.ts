"use server";

import { NextApiRequest, NextApiResponse } from "next";
import Connect from "@/db/dbConfig";
import jwt from "jsonwebtoken";

interface JwtPayload {
    userRole: string;
}

export default async function CharacterApi(req: NextApiRequest, res: NextApiResponse) {
    const authHeaders = req.headers["authorization"];

    if (!authHeaders || !authHeaders.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeaders.split(" ")[1];

    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    } catch (error) {
        return res.status(403).json({ error: `Invalid token ${error}` });
    }

    const userRole = decoded.userRole;

    const { name, description, territories } = req.body;

    const filePath = req.body.coverName;

    const conn = await Connect();

    if (req.method === "POST") {
        try {
            const characterQuery = await conn.query(
                `INSERT INTO characters (name, description, cover) VALUES ($1, $2, $3) RETURNING id`,
                [name, description, filePath]
            );

            const characterId = characterQuery.rows[0].id;

            await conn.query(
                `INSERT INTO character_territories (character_id, territory_id)
                SELECT \$1, unnest(\$2::int[])
                ON CONFLICT DO NOTHING`,
                [characterId, territories]
            )
            return res.status(201).json({ message: "character was added" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal server error" });
        } finally {
            await conn.end();
        }
    }else if (req.method === 'PUT' && userRole === 'admin') {
        const name = req.body.name
        const description = req.body.description;
        const cover = req.body.cover;
        const territories = req.body.territories
        const characterID = req.body.characterID;
        try {
            await conn.query(`UPDATE characters SET name = $1, description = $2, cover = $3 WHERE id = $4`, 
                [name, description, cover, characterID]
            )

            await conn.query(`
                WITH deletions AS (
                    DELETE FROM character_territories 
                    WHERE character_id = \$1 
                    RETURNING territory_id
                ),
                insertions AS (
                    INSERT INTO character_territories (character_id, territory_id)
                    SELECT \$1, unnest(\$2::int[])
                    ON CONFLICT DO NOTHING
                    RETURNING territory_id
                )
                SELECT 
                    (SELECT count(*) FROM deletions) AS deleted,
                    (SELECT count(*) FROM insertions) AS inserted;
            `, [characterID, territories]);

            return res.status(200).json({ message: "data was updated" });
        }catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal server error" });
        }finally {
            await conn.end();
        }
    }else if (req.method === "DELETE" && userRole === "admin") {
        const characterID = req.query.characterID;
        try {
            await conn.query(`DELETE FROM characters WHERE id = $1`,
                [characterID]
            )
            return res.status(200).json({ message: "data was deleted" });
        }catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal server error" });
        }finally {
            await conn.end();
        }
    }
}
