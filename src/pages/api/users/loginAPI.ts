"use server";
import Connect from "@/db/dbConfig";
import { compare } from "bcrypt";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import * as Yup from "yup";

const validationSchema = Yup.object().shape({
    username: Yup.string().min(4, 'Username must be at least 4 characters').required('Enter your username'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Enter your password'),
});

export default async function Login(req, res) {
    if (req.method === "POST") {
        try {
            const {username, password} = await validationSchema.validate(req.body, {abortEarly: false});
            
            const conn = await Connect();

            try {
                const result = await conn.query('SELECT * FROM users WHERE username = $1', [username]);
                const userData = result.rows[0];
                if (!userData) {
                    return res.status(401).json({ message: "Invalid username or password" });
                }
    
                const passwordMatch = await compare(password, userData.password);
                if (!passwordMatch) {
                    return res.status(401).json({ message: "Invalid username or password" });
                }
    
                const token = jwt.sign({userId: userData.id, userRole: userData.role, profileAccess: false}, process.env.JWT_SECRET);
                const serializedCookie = serialize('auth_token', token, {
                    httpOnly: false,
                    sameSite: 'strict',
                    maxAge: 86400,
                    path: '/',
                });
    
                res.setHeader('Set-cookie', serializedCookie);
                res.status(200).json({ message: 'Login successful', redirectUrl: '/' });
            }catch (error) {
                console.error(error.stack);
                return res.status(500).json({ message: "Internal server error" });
            }finally {
                await conn.end();
            }
            
        }catch (error) {
            if (error instanceof Yup.ValidationError) {
                const fieldErrors: Record<string, string> = {};
                error.inner.forEach((err) => {
                    const fieldName = err.path;
                    fieldErrors[fieldName] = err.message;
                });
                console.log(fieldErrors);
                res.status(400).json({ message: "Validation error", errors: fieldErrors });
            } else {
                res.status(400).json({ message: (error as Error).message });
            }
        }
    }
}