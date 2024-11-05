import Connect from "@/db/dbConfig";
import jwt from "jsonwebtoken";

export async function saveMessageToDB(content, roomID, cookies) {
    if (!cookies) {
        console.error("No cookies found, cannot save message");
        return;
    }

    const token = cookies;
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.userId) {
            console.error("Token is invalid or lacks necessary claims");
            return;
        }
    } catch (errors) {
        console.error("Invalid token:", errors);
        return;
    }

    const conn = await Connect();

    try {
        await conn.query(
            'INSERT INTO messages (room_id, user_id, message, sent_at) VALUES ($1, $2, $3, NOW())',
            [roomID, decoded.userId, content]
        );
    } catch (errors) {
        console.error("Error saving message to DB:", errors);
    } finally {
        await conn.end();
    }
}
