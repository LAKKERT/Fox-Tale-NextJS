"use server";
import { NextApiRequest, NextApiResponse } from "next";
import Connect from "@/db/dbConfig";
import * as Yup from "yup";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const validationCodeSchema = Yup.object().shape({
    code: Yup.number()
        .min(1000, "Number must be a 4-digit number")
        .max(9999, "Number must be a 4-digit number")
        .typeError("Please enter a 4-digit number"),
});

interface JwtPayload {
    userID: string;
}

export default async function verificationEmail(req: NextApiRequest, res: NextApiResponse) {
    const authHeader = req.headers["authorization"];
    console.log(authHeader)

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized", redirectUrl: "/" });
    }

    const token = authHeader.split(' ')[1];

    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    } catch (error) {
        return res
            .status(401)
            .json({ message: `Invalid token ${error}`, redirectUrl: "/" });
    }

    if (req.method === "POST") {
        try {
            const { code } = await validationCodeSchema.validate(req.body, {
                abortEarly: false,
            });

            const conn = await Connect();
            let userCode: number | null;

            try {
                const result = await conn.query(
                    "SELECT verificationcode FROM users WHERE id = $1",
                    [decoded.userID]
                );
                userCode = result.rows.length ? result.rows[0].verificationcode : null;
            } catch (error) {
                console.error(error);
                return res
                    .status(500)
                    .json({ message: "Internal server error", redirectUrl: "/" });
            } finally {
                conn.end();
            }

            if (userCode === null) {
                return res
                    .status(404)
                    .json({ message: "User not found", redirectUrl: "/" });
            }

            if (userCode === code) {
                const conn = await Connect();
                await conn.query("UPDATE users SET verified = $1 WHERE id = $2", [
                    true,
                    decoded.userID,
                ]);
                await conn.end();

                const serializedCookie = serialize("regToken", "", {
                    httpOnly: false,
                    sameSite: "strict",
                    maxAge: 0,
                    path: "/",
                });

                res.setHeader("Set-cookie", serializedCookie);
                return res
                    .status(200)
                    .json({ message: "Success registration", redirectUrl: "/login" });
            } else {
                return res
                    .status(400)
                    .json({ message: "Invalid verification code", redirectUrl: "/" });
            }
        } catch (error) {
            console.error(error);
            return res
                .status(500)
                .json({ message: "Internal server error", redirectUrl: "/" });
        }
    } else if (req.method === "DELETE") {
        if (!token) {
            console.error("No token found in cookies");
            return res
                .status(401)
                .json({ message: "No token provided", redirectUrl: "/" });
        }

        const conn = await Connect();
        await conn.query("DELETE FROM users WHERE id = $1", [decoded.userID]);
        await conn.end();

        const serializedCookie = serialize("regToken", "", {
            httpOnly: false,
            sameSite: "strict",
            maxAge: 0,
            path: "/",
        });

        res.setHeader("Set-cookie", serializedCookie);
        res.status(200).json({ message: "registration failed" });
    } else {
        return res
            .status(405)
            .json({ message: "Method not allowed", redirectUrl: "/" });
    }
}
