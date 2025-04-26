"use server";
import { NextApiRequest, NextApiResponse } from "next";
import Connect from "@/db/dbConfig";
import * as Yup from "yup";

import bcrypt from "bcrypt";

const validationSchema = Yup.object().shape({
    token: Yup.string(),
    password: Yup.string().min(6, "Password must be at least 6 characters").required("Enter your password"),
    repeatPassword: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Confirm your password')
})

export default async function resetPassword(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { token, password } = await validationSchema.validate(req.body, {abortEarly: false});
        if (!token) {
            return res.status(401).json({ message: "Token is not exist" });
        }
        
        const conn = await Connect();
        const result = await conn.query('SELECT user_id, expires_at FROM password_reset WHERE token = $1', [token]);

        if (!result.rows.length || new Date() > result.rows[0].expires_at) {
            console.error("token expired");
            const conn = await Connect();
            await conn.query('DELETE FROM password_reset WHERE token = $1', [token]);
            await conn.end();
            return res.status(401).json({ message: "Token is expired or invalid" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await conn.query('DELETE FROM password_reset WHERE token = $1', [token]);
        await conn.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, result.rows[0].user_id])
        await conn.end();

        res.status(200).json({ message: "Password reset successfully", redirectUrl: "/login" });
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
}