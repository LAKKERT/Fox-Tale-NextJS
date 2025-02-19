'use server';
import Connect from "@/db/dbConfig";
import { NextApiRequest, NextApiResponse } from "next";

export default async function fetchLatestNews(req:NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        try {
            const conn = await Connect();

            try {
                const result = await conn.query(`SELECT id, title, description, add_at FROM news order by add_at desc limit 3`)
                return res.status(200).json({result: result.rows});
            }catch (error) {
                console.error("Failed to select news", error);
                return res.status(500).json({ message: "Failed to fetch latest news" });
            }

        }catch (error) {
            console.error("Failed to fetch latest news", error);
            return res.status(500).json({ message: "Failed to fetch latest news" });
        }
    }else {
        return res.status(405).json({ message: "Method not allowed" });
    }
}