"use server";

import { NextApiRequest, NextApiResponse } from "next";
import Connect from "@/db/dbConfig";
import jwt from "jsonwebtoken";

interface JwtPayload {
    userRole: string;
}

export default async function universeApi(req: NextApiRequest, res: NextApiResponse) {
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

    const { name, description } = req.body;

    const filePath = req.body.coverName;

    const conn = await Connect();

    if (req.method === "POST" && userRole === "admin") {
        try {
            await conn.query(
                `INSERT INTO universe (name, description, cover) VALUES ($1, $2, $3) RETURNING id`,
                [name, description, filePath]
            );
            return res.status(201).json({ message: "universe was added" });
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
        const universeID = req.body.universeID;
        try {
            await conn.query(`UPDATE universe SET name = $1, description = $2, cover = $3 WHERE id = $4`, 
                [name, description, cover, universeID]
            )
            return res.status(200).json({ message: "data was updated" });
        }catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal server error" });
        }finally {
            await conn.end();
        }
    }else if (req.method === "DELETE" && userRole === "admin") {
        const universeID = req.query.universeID;
        try {
            await conn.query(`DELETE FROM universe WHERE id = $1`,
                [universeID]
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
