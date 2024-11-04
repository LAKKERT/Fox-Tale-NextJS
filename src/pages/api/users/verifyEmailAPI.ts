"use server";
import Connect from "@/db/dbConfig";
import * as Yup from "yup";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const validationCodeSchema = Yup.object().shape({
    code: Yup.number().min(1000, 'Number must be a 4-digit number').max(9999, 'Number must be a 4-digit number').typeError('Please enter a 4-digit number'),
})

export default async function verificationEmail(req, res) {
    if (req.method === 'POST') {
        try {
            const { code } = await validationCodeSchema.validate(req.body, { abortEarly: false });

            const token = req.cookies.regToken;
            let decoded;

            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (error) {
                return res.status(401).json({ message: 'Invalid token' });
            }

            const conn = await Connect();
            const result = await conn.query('SELECT verificationcode FROM users WHERE id = $1', [decoded.userID]);
            await conn.end();

            const userCode = result.rows.length ? result.rows[0].verificationcode : null;

            if (userCode === null) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (userCode === code) {
                const conn = await Connect();
                await conn.query('UPDATE users SET verified = $1 WHERE id = $2', [true, decoded.userID]);
                await conn.end();

                const serializedCookie = serialize("regToken", "", {
                    httpOnly: false,
                    sameSite: 'strict',
                    maxAge: 0,
                    path: '/',
                });

                res.setHeader('Set-cookie', serializedCookie);
                return res.status(200).json({message: 'Success registration', redirectUrl: '/login'});
            } else {
                return res.status(400).json({ message: 'Invalid verification code' });
            }

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error', redirectUrl: '/'});
        }

    } else if (req.method === 'DELETE') {
        const token = req.cookies.regToken;

        if (!token) {
            console.error("No token found in cookies");
            return res.status(401).json({ message: 'No token provided', redirectUrl: '/' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        const conn = await Connect();
        await conn.query('DELETE FROM users WHERE id = $1', [decoded.userID]);
        await conn.end();

        const serializedCookie = serialize('regToken', "", {
            httpOnly: false,
            sameSite: 'strict',
            maxAge: 0,
            path: '/',
        });

        res.setHeader('Set-cookie', serializedCookie);
        res.status(200).json({message: 'registration failed'});
    } else {
        return res.status(405).json({ message: 'Method not allowed' });
    }
}
