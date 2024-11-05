"use server";

import Connect from "@/db/dbConfig";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";

export async function GetAllRequests(cookies) {
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

export async function getChatRoom(roomID) {
    const conn = await Connect();

    try {
        const chatRoom = await conn.query("SELECT * FROM chat_room WHERE id = $1", [roomID]);
        const participantsID = await conn.query("SELECT user_id FROM participants WHERE room_id = $1", [roomID] )
        const userIds = participantsID.rows.map(row => row.user_id);
        const participants = await conn.query("SELECT username FROM users WHERE id = ANY($1::uuid[])", [userIds]);

        return { chatData: chatRoom.rows[0], usersData: participants.rows };
    }catch (errors) {
        console.error("Error getting chat room:", errors);
        throw errors;
    }finally {
        await conn.end();
    }
}

export async function addNewParticipant(cookies, roomID) {
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
