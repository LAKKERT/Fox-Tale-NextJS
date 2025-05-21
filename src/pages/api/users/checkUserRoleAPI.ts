'use server';
import jwt from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";

interface UserPayLoad extends jwt.JwtPayload {
    role: string
}

export default async function ChechUserRole(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === "GET") {
        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.error("Authorization header is missing or invalid");
            return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];

        let decoded;
        
        try {
            decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET as string) as UserPayLoad;
            return res.status(200).json({ userRole: decoded.userRole })
        } catch (error) {
            console.error("Invalid token", error);
            return res.status(403).json({ error: "Token is not vailed" });
        }
    }
}
