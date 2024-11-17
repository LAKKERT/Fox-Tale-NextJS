"use server";

import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

export default async function getUserDataByCookie(req, res) {
    if (!req.cookies.auth_token) {
        return redirect('/');
    }

    const token = req.cookies.auth_token;
    
    let decoded;
    try {
        decoded = await jwt.verify(token, process.env.JWT_SECRET);
        return res.status(200).json({ userID: decoded.userId, userRole: decoded.userRole});
    }catch (errors) {
        console.error("Invalid token:", errors);
        return redirect('/');
    }
}
