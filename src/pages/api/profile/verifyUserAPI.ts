"use server";
import Connect from "@/db/dbConfig";
import * as Yup from "yup";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

const validationSchema = Yup.object().shape({
    code: Yup.number().min(1000, 'Number must be a 4-digit number').max(9999, 'Number must be a 4-digit number').typeError('Please enter a 4-digit number'),
})

function generateCode() {
    return Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
}

export async function createVerificationCode(cookies) {
    const token = cookies.auth_token;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    }catch (error) {
        console.error('Invalid token:', error);
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const userID = decoded.userId;

    try {
        const code = generateCode();
        console.log(code);

        const conn = await Connect();
        await conn.query('UPDATE users SET verificationcode = $1 WHERE id = $2', [code, userID])
        await conn.end();

        return code;
    }catch (error) {
        console.error(error);
    }
}

export default async function VerifyUser(req, res) {
    if (req.method === 'POST') {
        try {
            const { code, cookies } = await validationSchema.validate(req.body, { abortEarly: false });

            const token = cookies.auth_token;

            if (!token) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
        
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            }catch (error) {
                console.error('Invalid token:', error);
                return res.status(401).json({ message: 'Unauthorized' });
            }
        
            const userID = decoded.userId;

            const conn = await Connect();
            const verificationCodeResult = await conn.query('SELECT verificationcode FROM users WHERE id = $1', [userID])
            await conn.end();

            if (verificationCodeResult.rows.length > 0) {
                console.log("code exists");
            }else {
                console.error("code not found");
                return res.status(404).json({ message: 'code not found' });
            }

            const verificationCode = verificationCodeResult.rows[0].verificationcode;
            
            if (verificationCode === code) {
                const verified = true;
                const conn = await Connect()
                await conn.query('UPDATE users SET verified = $1 WHERE id = $2', [verified, userID])
                res.status(200).json({ message: 'Verified', redirectUrl: `/profile/${userID}`});
            }else {
                res.status(400).json({ message: 'access denied' });
            }

        } catch (error) {
            if (error instanceof Yup.ValidationError) {
                const fieldErrors: Record<string, string> = {};
                error.inner.forEach((err) => {
                    const fieldName = err.path;
                    fieldErrors[fieldName] = err.message;
                });
                res.status(400).json({ message: "Validation error", errors: fieldErrors });
            } else {
                res.status(400).json({ message: (error as Error).message });
            }
        }
    } else {
        console.error("Method not allowed");
        return res.status(405).json({ message: "method not allowed"});
    }
}