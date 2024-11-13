"use server";
import Connect from "@/db/dbConfig";

export default async function lastSeenMessage(req, res) {
    if (req.method === "POST") {
        console.error("lastSeenMessage");
        const conn = await Connect();

        console.error(req.body)

        try {
            await conn.query(`INSERT INTO last_message (last_message_id, user_id, room_id) VALUES ($1, $2, $3)
                ON CONFLICT ( user_id )
                DO UPDATE SET last_message_id = EXCLUDED.last_message_id
                WHERE EXCLUDED.last_message_id > last_message.last_message_id
                `, [req.body.lastSeenMessage, req.body.userID, req.body.roomID]);
        }catch (errors) {
            console.error("Error saving last seen message:", errors);
            res.status(400).json({errors: errors});
        }finally {
            await conn.end();
            res.status(200).json({message: "Last seen message saved successfully"});
        }
    }else if (req.method === "GET") {

        const { userID, roomID } = req.query;
        console.log(userID, roomID);

        if (!userID || !roomID) {
            return res.status(400).json({ error: 'Missing userID or roomID' });
        }

        const conn = await Connect();
        try {
            const result = await conn.query("SELECT * FROM last_message WHERE user_id = $1 AND room_id = $2", [userID, roomID]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ message: "No data found" });
            }
            
            res.status(200).json(result.rows[0]);
        }catch (error) {
            console.error("Error getting last seen message:", error);
            res.status(400).json({error: error});
        }finally {
            await conn.end();
        }
    }else {
        res.setHeader('Allow', ['POST', 'GET']);
        res.status(405).end(`Method ${req.method} not allowed`);
    }
}