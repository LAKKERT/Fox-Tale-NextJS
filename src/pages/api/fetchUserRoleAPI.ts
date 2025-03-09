"use server";
import jwt from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";

interface JwtPayload {
    userId: string;
    userRole: string;
}

export default async function fetchUserRole(req: NextApiRequest, res: NextApiResponse) {
    try {
        const authHeader = req.headers["authorization"];

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized", redirectUrl: "/" });
        }

        const token = authHeader.split(" ")[1];

        let decoded;

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        } catch (error) {
            console.error(error);
            return res.status(403).json({ message: "Invaled token", redirectUrl: "/" });
        }

        const userRole = decoded.userRole;
        const userID = decoded.userId;

        res.status(200).json({ userRole: userRole, userID: userID, redirectUrl: "/" });
    } catch (error) {
        console.error(error);
        res.status(404);
    }
}
