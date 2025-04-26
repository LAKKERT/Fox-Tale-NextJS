"use server";
import { NextApiRequest, NextApiResponse } from "next";
import Connect from "@/db/dbConfig";
import * as Yup from "yup";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";


const validationSchema = Yup.object().shape({
    code: Yup.number()
        .min(1000, "Number must be a 4-digit number")
        .max(9999, "Number must be a 4-digit number")
        .typeError("Please enter a 4-digit number"),
});

interface JwtPayload {
    profileAccess: boolean;
    userId: string;
    userRole: string;
}

export default async function VerifyUser(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST" || req.method === "GET") {
        try {

            const authHeader = req.headers['authorization'];

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                console.error('Authorization header is missing or invalid');
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const token = authHeader.split(' ')[1];

            let decoded;

            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
                if (decoded.profileAccess === true || decoded.userRole === 'admin') {
                    return res.status(201).json({ redirectUrl: `/profile/${decoded.userId}` });
                }
            } catch (error) {
                console.error("Invalid token:", error);
                return res.status(400).json({ error: "Invalid token" });
            }

            const userID = decoded.userId;

            const conn = await Connect()

            try {
                if (req.method === 'POST') {
                    const { code } = await validationSchema.validate(req.body, {
                        abortEarly: false,
                    });

                    const result = await conn.query('SELECT verificationcode FROM users WHERE id = $1', [userID])

                    if (result.rows[0].verificationcode == code) {
                        decoded.profileAccess = true;
                    } else {
                        console.error("Incorrect verification code");
                        return res.status(401).json({ message: "Incorrect verification code" });
                    }


                    const updateToken = jwt.sign(decoded, process.env.JWT_SECRET as string);

                    const serializedCookie = serialize("auth_token", updateToken, {
                        httpOnly: false,
                        sameSite: "strict",
                        maxAge: 86400,
                        path: "/",
                    });

                    res.setHeader("Set-cookie", serializedCookie);

                    res.status(200).json({
                        message: "Verified",
                        access: true,
                        redirectUrl: `/profile/${userID}`,
                    })
                }

            } catch (error) {
                console.error("Error querying database:", error);
                return res.status(500).json({ message: "Server error" });
            } finally {
                await conn.end()
            }

        } catch (error) {
            if (error instanceof Yup.ValidationError) {
                const fieldErrors: Record<string, string> = {};
                error.inner.forEach((err) => {
                    if (err.path !== undefined) {
                        const fieldName = err.path;
                        fieldErrors[fieldName] = err.message;
                    }
                });
                return res.status(400).json({ errors: fieldErrors });
            } else {
                res.status(400).json({ message: (error as Error).message });
            }
        }
    } else {
        console.error("Method not allowed");
        return res.status(405).json({ message: "method not allowed" });
    }
}
