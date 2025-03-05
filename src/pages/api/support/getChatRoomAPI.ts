'use server';
import { NextApiRequest, NextApiResponse } from "next";
import Connect from '@/db/dbConfig';
import jwt from "jsonwebtoken";

export default async function getChatRoom(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {

        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('Authorization header is missing or invalid');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        let decoded;
        if (token) {
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET as string);
            }catch(error) {
                console.error('Invalid token:', error);
                return res.status(401).json({ error: 'Invalid token', redirectUrl: '/' });
            }
        }
        
        const roomId = req.body.roomID;
        const userId = decoded?.userId;
        const userRole = decoded?.userRole;

        if (!roomId) {
            return res.status(404).json({ error: 'Missing roomID parameter' });
        }

        const conn = await Connect();

        try {
            const chatRoom = await conn.query("SELECT * FROM chat_room WHERE id = $1::uuid", [roomId]);
            
            if (chatRoom.rows.length === 0) {
                return res.status(404).json({ error: 'Chat room not found' });   
            }
            
            const existingParticipant = await conn.query(
                "SELECT 1 FROM participants WHERE user_id = $1 AND room_id = $2",
                [userId, roomId]
            );
            
            if (existingParticipant.rowCount === 0) {
                await conn.query("INSERT INTO participants (user_id, room_id) VALUES ($1, $2)", [userId, roomId]);
            }
            
            
            const participantsID = await conn.query("SELECT user_id FROM participants WHERE room_id = $1::uuid", [roomId]);
            const userIds = participantsID.rows.map((row: { user_id: any; }) => row.user_id);
            const participants = await conn.query("SELECT id, username, role FROM users WHERE id = ANY($1::uuid[])", [userIds]);
            
            const result = await conn.query(
                "SELECT user_id, message, file_url FROM messages WHERE room_id = $1 ORDER BY sent_at ASC",
                [roomId]
            );
            

            return res.status(200).json({ chatData: chatRoom.rows[0], usersData: participants.rows, currentUserId: {userID:userId, userRole: userRole}, messages: result.rows });
        }catch (error) {
            console.error("Error connecting to the database:", error);
            return res.status(500).json({ message: 'server error occured' });
        }finally {
            await conn.end();
        }
        
    } else {
        return res.status(405).json({ error: 'Method is not allowed' });
    }
}