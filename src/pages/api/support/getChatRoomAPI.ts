'use server';

import Connect from '@/db/dbConfig';

export default async function getChatRoom(req, res) {
    if (req.method === 'GET') {
        const roomID = req.query.roomID;
        if (!roomID) {
            return res.status(400).json({ error: 'Missing roomID parameter' });
        }

        const conn = await Connect();
        try {
    
            const chatRoom = await conn.query("SELECT * FROM chat_room WHERE id = $1::uuid", [roomID]);
            
            if (chatRoom.rows.length === 0) {
                return res.status(404).json({ error: 'Chat room not found' });   
            }
            
            const participantsID = await conn.query("SELECT user_id FROM participants WHERE room_id = $1::uuid", [roomID]);
            const userIds = participantsID.rows.map((row: { user_id: any; }) => row.user_id);
            const participants = await conn.query("SELECT id, username, role FROM users WHERE id = ANY($1::uuid[])", [userIds]);
    
            return res.status(200).json({ chatData: chatRoom.rows[0], usersData: participants.rows });
        } catch (errors) {
            console.error("Error getting chat room:", errors);
            throw errors;
        } finally {
            await conn.end();
        }
    } else {
        return res.status(405).json({ error: 'Method is not allowed' });
    }
}