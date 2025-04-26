"use server";
import { NextApiRequest, NextApiResponse } from "next";
import Connect from "@/db/dbConfig";
import * as Yup from "yup";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

import bcrypt from "bcrypt";

const schema = Yup.object().shape({
    email: Yup.string().email('EMAIL is not correct server').required('Enter your EMAIL'),
    username: Yup.string().min(4, 'Username must be at least 4 characters').required('Enter your username'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Enter your password'),
    password2: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Confirm your password')
});

interface CheckResult {
    emailExist: boolean;
    usernameExist: boolean;
}

async function checkEmailandLoginExists(email: string, username: string): Promise<CheckResult> {
    const conn = await Connect();
    try {
        const result = await conn.query(
            'SELECT * FROM users WHERE email = \$1 OR username = \$2', 
            [email, username]
        );
        
        return {
            emailExist: result.rows.some((row: {email:string}) => row.email === email),
            usernameExist: result.rows.some((row: {username:string}) => row.username === username)
        };
    } catch (errors) {
        console.error('Error in database query:', errors);
        return { 
            emailExist: false, 
            usernameExist: false 
        };
    } finally {
        await conn.end();
    }
}

export default async function CreateUser(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        try {
            const { email, username, password } = await schema.validate(req.body, { abortEarly: false });

            const { emailExist, usernameExist } = await checkEmailandLoginExists(email, username);

            if (emailExist) {
                return res.status(400).json({ message: "Email already exists" });
            }

            if (usernameExist) {
                return res.status(400).json({ message: "Username already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const uniqueID = uuidv4();

            const conn = await Connect();

            try {
                await conn.query(`
                    INSERT INTO users (id, email, username, password)
                    VALUES ($1, $2, $3, $4)
                `, [uniqueID, email, username, hashedPassword]);
            }catch (error) {
                console.error('Error in database query:', error);
                res.status(500).json({ message: "Server error" });
            }finally {
                await conn.end();
            }

            const token = jwt.sign({ userID: uniqueID, email: email }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

            const serializedCookie = serialize('regToken', token, {
                httpOnly: false,
                sameSite: 'strict',
                maxAge: 3600,
                path: '/',
            })

            res.setHeader('Set-cookie', serializedCookie);

            return res.status(201).json({ message: "User created successfully", redirectUrl: '/signup/emailVerify' });

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
            }else {
                res.status(400).json({ message: (error as Error).message });
            }
        }
    }
}