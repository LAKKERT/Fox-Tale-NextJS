'use server'

import { NextApiRequest, NextApiResponse } from "next";
import Connect from "@/db/dbConfig";
import jwt from 'jsonwebtoken';

export default async function fetchUniverse(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        const conn = await Connect();

        try {
            const result = await conn.query(`SELECT * FROM characters`);
            return res.status(200).json({ data: result.rows });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        } finally {
            await conn.end();
        }
    }
}