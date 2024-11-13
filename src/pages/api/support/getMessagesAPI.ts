"use server";
import Connect from "@/db/dbConfig";

export default async function GetMessages(req, res) {
    if (req.method === "GET") {
        const roomID = req.query.roomID

        const conn = await Connect();

        try {
            const result = await conn.query(
                "SELECT user_id, message, file_url FROM messages WHERE room_id = $1 ORDER BY sent_at ASC",
                [roomID]
            );
            res.status(200).json({ messages: result.rows });
        } catch (errors) {
            console.error(errors);
            res.status(500).json({ message: "Internal Server Error" });
        } finally {
            await conn.end();
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}
