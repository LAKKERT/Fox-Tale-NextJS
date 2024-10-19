"use server";
import Connect from "@/db/dbConfig";
import { compare } from "bcrypt";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

export default async function Login(req, res) {
    if (req.method === "POST") {
        try {
            const {username, password} = await req.body;

            const conn = await Connect();
            const result = await conn.query('SELECT * FROM users WHERE username = $1', [username]);
            await conn.end();

            const userData = result.rows[0];
            if (!userData) {
                return res.status(401).json({ message: "Invalid username or password" });
            }

            const passwordMatch = await compare(password, userData.password);
            if (!passwordMatch) {
                return res.status(401).json({ message: "Invalid username or password" });
            }

            const token = jwt.sign({userId: userData.id, userRole: userData.role, profileAccess: false}, process.env.JWT_SECRET, {expiresIn: '1d'});

            const serializedCookie = serialize('auth_token', token, {
                httpOnly: false,
                sameSite: 'strict',
                maxAge: 86400,
                path: '/',
            });

            res.setHeader('Set-cookie', serializedCookie);
            res.status(200).json({ message: 'Login successful', redirectUrl: '/' });

        }catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    }
}