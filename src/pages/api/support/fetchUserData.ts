"use server";

import jwt from "jsonwebtoken";

export default async function getUserDataByCookie(req, res) {

    const token = req.cookies.auth_token;
    
    let decoded;
    try {
        decoded = await jwt.verify(token, process.env.JWT_SECRET);
        return res.status(200).json({ userID: decoded.userId, userRole: decoded.userRole});
    }catch (errors) {
        console.error("Invalid token:", errors);
        return res.status(403).json({ error: "Invalid token" });
    }
}
