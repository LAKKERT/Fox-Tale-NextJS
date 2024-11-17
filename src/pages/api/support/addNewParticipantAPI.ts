"use server";

import Connect from "@/db/dbConfig";
import jwt from "jsonwebtoken";

export default async function addNewParticipant(req, res) {
    if (req.method === "POST") {
        const { cookies, roomID } = req.body;

        if (!cookies) {
            console.error("No cookies found");
            return res.status(400).json({ error: "Missing cookies" });
        }

        const token = req.cookies.auth_token;
        let decoded;

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (errors) {
            console.error("Invalid token:", errors);
            return res.status(401).json({ error: "Invalid token" });
        }

        const conn = await Connect();

        try {
            const existingParticipant = await conn.query(
                "SELECT 1 FROM participants WHERE user_id = $1 AND room_id = $2",
                [decoded.userId, roomID]
            );

            if (existingParticipant.rowCount > 0) {
                return res.status(200).json({ message: "Participant already exists" });
            }

            await conn.query("INSERT INTO participants (user_id, room_id) VALUES ($1, $2)", [decoded.userId, roomID]);
            return res.status(201).json({ message: "Participant added successfully" });

        } catch (errors) {
            console.error("Error adding new participant:", errors);
            return res.status(500).json({ error: "Internal server error" });
        } finally {
            await conn.end();
        }
    } else {
        console.error('Method is not allowed');
        return res.status(405).json({ error: "Method Not Allowed" });
    }
}
