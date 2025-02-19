"use server";
import { NextApiRequest, NextApiResponse } from "next";
import * as Yup from "yup";
import Connect from "@/db/dbConfig";
import transporter from "@/helpers/nodeMailerConfig";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

const validationSchema = Yup.object().shape({
    email: Yup.string().email('Email is not correct').required('Enter your EMAIL'),
});

export default async function sendToken(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        if (!req.body.clientChoice || req.body.clientChoice === "") {
            res.status(401).json({ message: "Invailed choice" });
            console.error("invailed choice");
        }
        
        if (req.body.clientChoice === "forgetLogin") {
            try {

                const userEmail = req.body.email;
                const conn = await Connect();
                const result = await conn.query('SELECT username FROM USERS WHERE email = $1', [userEmail]);
                await conn.end();

                if (result.rows.length === 0) {
                    console.error("Email is not exists");
                    return res.status(400).json({ message: "Email is not exists" });
                }

                const emailOptions = {
                    from: process.env.SMTP_USER,
                    to: userEmail,
                    subject: "login",
                    html: `Your login: ${result.rows[0].username}`
                }

                try {
                    await transporter.sendMail(emailOptions);
                    res.status(200).json({ message: "Email sent successfully" });
                } catch (errors) {
                    console.error("Failed to send verification email:", errors);
                    res.status(500).json({ message: "Failed to send email" });
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

        } else if (req.body.clientChoice === "forgetPassword") {
            try {
                const { email } = await validationSchema.validate(req.body, { abortEarly: false });
                
                const conn = await Connect();
                const result = await conn.query('SELECT id, email FROM users WHERE email = $1', [email]);
                
                if (!result.rows.length) {
                    return res.status(400).json({ message: "Email not found" });
                }
                
                const uniqueID = uuidv4();
                const userID = result.rows[0].id;
                const token = crypto.randomBytes(32).toString('hex');
                const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
                
                try {
                    await conn.query('INSERT INTO password_reset (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)', [uniqueID, userID, token, expiresAt]);
                    await conn.end();
                }catch (errors) {
                    console.error("Failed to create password reset:", errors);
                    return res.status(500).json({ message: "Failed to create password reset" });
                }
                
                const resetLink = `http://localhost:3000/restoring_access/resetPassword?token=${token}`;

                const mailOptions = {
                    from: process.env.SMTP_USER,
                    to: email,
                    subject: "Password Reset",
                    html: `Click the link to reset your password: ${resetLink}`
                }
                
                try {
                    await transporter.sendMail(mailOptions);
                } catch (error) {
                    console.error("Failed to send verification email:", error);
                }

                return res.status(200).json({ message: 'Password reset link sent' });

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
        }

    } else {
        console.error("Method not allowed");
        return res.status(405).json({ message: "method not allowed" });
    }
}