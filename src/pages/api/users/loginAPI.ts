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

            const token = jwt.sign({userId: userData.id}, process.env.JWT_SECRET, {expiresIn: '1h'});

            const serializedCookie = serialize('auth_token', token, {
                httpOnly: false, // передаётся только по https, не работает запросы через JS
                sameSite: 'strict',
                maxAge: 60 * 60,
                path: '/',
            });

            res.setHeader('set-cookie', serializedCookie);
            res.status(200).json({ message: 'Login successful' });

        }catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    }
}