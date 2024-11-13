"use server";

import Connect from "@/db/dbConfig";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";

export async function GetAllRequests(cookies: { auth_token?: string; }) {
    if (!cookies.auth_token) {
        redirect("/");
    }

    const token = cookies.auth_token;
    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    }catch (error) {
        console.error("Invalid token:", error);
        redirect("/");
    }

    const currentUserRole = decoded.userRole;

    if (currentUserRole === "admin") {
        const conn = await Connect();

        try {
            const result = await conn.query("SELECT * FROM chat_room")
            
            return result.rows;
        }catch (errors) {
            console.error("Error getting all requests:", errors);
            throw errors;
        }finally {
            await conn.end();
        }
    }else {
        console.error("Invalid token:", currentUserRole);
        redirect("/");
    }
}

export async function getChatRoom(roomID: string) {
    const conn = await Connect();

    try {
        const formattedRoomID = roomID.toString(); 

        const chatRoom = await conn.query("SELECT * FROM chat_room WHERE id = $1::uuid", [formattedRoomID]);
        const participantsID = await conn.query("SELECT user_id FROM participants WHERE room_id = $1::uuid", [formattedRoomID]);
        const userIds = participantsID.rows.map((row: { user_id: any; }) => row.user_id);
        const participants = await conn.query("SELECT id, username, role FROM users WHERE id = ANY($1::uuid[])", [userIds]);

        return { chatData: chatRoom.rows[0], usersData: participants.rows };
    } catch (errors) {
        console.error("Error getting chat room:", errors);
        throw errors;
    } finally {
        await conn.end();
    }
}

export async function addNewParticipant(cookies: { auth_token?: any; }, roomID: any) {
    if (!cookies) {
        redirect("/");
    }

    const token = cookies.auth_token;
    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (errors) {
        console.error("Invalid token:", errors);
        redirect("/");
    }

    const conn = await Connect();

    try {
        const existingParticipant = await conn.query(
            "SELECT 1 FROM participants WHERE user_id = $1 AND room_id = $2",
            [decoded.userId, roomID]
        );

        if (existingParticipant.rowCount > 0) {
            return;
        }

        await conn.query("INSERT INTO participants (user_id, room_id) VALUES ($1, $2)", [decoded.userId, roomID]);
    } catch (errors) {
        console.error("Error adding new participant:", errors);
        throw errors;
    } finally {
        await conn.end();
    }
}

export async function closeChat(roomID: string, cookies: { auth_token?: any; }) {
    if (!cookies) {
        redirect("/");
    }

    const token = cookies.auth_token;

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    }catch (errors) {
        console.error("Invalid token:", errors);
        redirect("/");
    }
    
    if (decoded.userRole === 'admin') {
        const conn = await Connect();
    
        try {
            await conn.query(`UPDATE chat_room SET status = 'true' WHERE id = $1`, [roomID])
        }catch (errors) {
            console.error("Error closing chat room:", errors);
            throw errors;
        }finally {
            await conn.end();
        }
    }
}
