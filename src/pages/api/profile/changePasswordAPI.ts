"use server";
import Connect from "@/db/dbConfig";
import { Cookies } from "react-cookie";
import { compare } from "bcrypt";
import * as Yup from "yup";
import { v4 as uuidv4 } from "uuid";

const bcrypt = require("bcrypt");

const schema = Yup.object().shape({
    password1: Yup.string().min(6, 'Password must be at least 6 characters').required('Enter your password'),
    password2: Yup.string().min(6, 'Password must be at least 6 characters').required('Enter your new password'),
    repeatPassword2: Yup.string().oneOf([Yup.ref('password2'), null], 'Passwords must match').required('Repeat your new password'),
})

async function checkPassword(userID, password) {
    try {
        const conn = await Connect();
        const result = await conn.query('SELECT password FROM users WHERE id = $1', [userID]);
        conn.end();

        if (!result.rows.length) {
            console.error('User not found');
            return false;
        }

        const hashedPassword = result.rows[0].password;

        const passwordMatch = await compare(password, hashedPassword);
        
        return passwordMatch;
    } catch (error) {
        console.error("Error during password check:", error);
        throw error;
    }
}

export default async function ChangePassword(req, res) {
    if (req.method === "POST") {
        try {
            const { password1, password2, repeatPassword2 } = await schema.validate(req.body, {abortEarly: false})
            
            const passwordCompare = await checkPassword(req.body.id, password1)

            if(!passwordCompare) {
                console.error("password do not match");
                res.status(400).json({message: "Current password is incorrect"});
            }

            const hashedNewPassword = await bcrypt.hash(password2, 10)
            
            const conn = await Connect();
            const result = await conn.query(`UPDATE users SET password = $1 WHERE id = $2`, [hashedNewPassword, req.body.id]);
            await conn.end();

            return res.status(200).json({message: "Password updated successfully"});
        }catch (error) {
            if (error instanceof Yup.ValidationError) {
                const fieldErrors: Record<string, string> = {};
                error.inner.forEach((err) => {
                    const fieldName = err.path;
                    fieldErrors[fieldName] = err.message;
                })
                res.status(400).json({ errors: fieldErrors });
            }
        }
    }else {
        return res.status(405).json({message: "method not allowed"});
    }
}