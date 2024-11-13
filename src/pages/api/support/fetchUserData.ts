"use server";

import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

export async function getUserDataByCookie(cookies: { auth_token?: string; }) {
    if (!cookies.auth_token) {
        return redirect('/');
    }

    const token = cookies.auth_token;
    
    let decoded;
    try {
        decoded = await jwt.verify(token, process.env.JWT_SECRET);
        return { userID: decoded.userId, userRole: decoded.userRole};
        

    }catch (errors) {
        console.error("Invalid token:", errors);
        return redirect('/');
    }
}
