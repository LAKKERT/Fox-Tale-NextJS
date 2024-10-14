"use server";
import Connect from "@/db/dbConfig";
import jwt from "jsonwebtoken";
import { redirect } from 'next/navigation'

export async function getAllUsers(cookies) {
    const token = cookies.auth_token;
    if (!token) {
        console.log("Unauthorized");
        return redirect('/');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
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
        console.log("Access denied");
        return redirect('/');
    }
}

export async function getUserProfile(userID, cookies) {
    console.log(cookies);

    const token = cookies.auth_token;
    
    if (!token) {
        console.log("Unauthorized");
        return redirect('/');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const currentUser = decoded.userId;
        const currentUserRole = decoded.userRole;

        if (currentUserRole === "admin" || userID === currentUser) {

            const conn = await Connect();
            const result = await conn.query('SELECT * FROM users WHERE id = $1', [userID]);
            await conn.end();
    
            return result.rows[0];
        }else {
            console.log("Access denied");
            return redirect('/');
        }
    }catch (error) {
        console.error('Error getting user profile:', error);
        if (error.name === 'JsonWebTokenError') {
            console.log("Invalid token");
        }
        throw error;
    }

    // const {currentUser, currentUserRole} = await cookies;
    // if (!currentUser) { // не залогинен
    //     console.log("Unauthorized");
    //     return;
    // }else {
    //     try {
    //         // if (userID !== currentUser) {
    //         //     console.log("Access denied");
    //         //     return;
    //         // }
    //         // if (currentUserRole!== 'admin') { // не администратор
    //         //     console.log("Access denied");
    //         //     return;
    //         // }
    //         const conn = await Connect();
    //         const result = await conn.query('SELECT * FROM users WHERE id = $1', [userID]);
    //         await conn.end();
            
    //         return result.rows[0];
    //     }catch (error) {
    //         console.error('Error getting user profile:', error);
    //         throw error;
    //     }
    // }
}