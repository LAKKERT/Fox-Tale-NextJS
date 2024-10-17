"use server";
import Connect from "@/db/dbConfig";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";

export async function getAllUserData(cookies) {
    const token = cookies.auth_token;

    if(!token) {
        return redirect('/');
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    }catch (error) {
        console.error('Invalid token:', error);
        return redirect('/');
    }
    
    const currentUserId = decoded.userId;

    const conn = await Connect();
    const result = await conn.query('SELECT * FROM users WHERE id = $1', [currentUserId])
    await conn.end();
    
    return result.rows[0];
}

export async function getAllUsers(cookies) {
    const token = cookies.auth_token;

    if (!token) {
        return redirect('/');
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    }catch (error) {
        console.error('Invalid token:', error);
        return redirect('/');
    }
    
    const currentUserRole = decoded.userRole;

    if (currentUserRole === "admin") {
        try {
            const conn = await Connect();
            const result = await conn.query('SELECT * FROM users');
            await conn.end();
            
            return result.rows;
        } catch (error) {
            console.error('Error getting all users:', error);
            throw error;
        }
    }else {
        return redirect('/');
    }
}

export async function getUserProfile(userID, cookies) {
    const token = cookies.auth_token;

    if (!token) {
        return redirect('/');
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        console.error("Invalid token:", error);
        return redirect('/');
    }

    const currentUser = decoded.userId;
    const currentUserRole = decoded.userRole;

    // Разрешение доступа для админов и текущего пользователя
    if (currentUserRole === "admin" || userID === currentUser) {
        const conn = await Connect();
        const result = await conn.query('SELECT * FROM users WHERE id = $1', [userID]);
        await conn.end();

        if (result.rows.length === 0) {
            console.error("User not found.");
            return redirect('/');
        }

        return result.rows[0];
    } else {
        return redirect('/');
    }
}

