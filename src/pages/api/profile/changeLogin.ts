"use server";
import * as Yup from "yup";
import Connect from "@/db/dbConfig";
import { NextApiRequest, NextApiResponse } from "next";

const validationSchema = Yup.object().shape({
    login: Yup.string().min(4, "Login must be at least 4 characters").required("Enter your new login")
})

async function checkLoginExists(login: string) {
    try {
        const conn = await Connect();
        const result = await conn.query('SELECT username FROM users WHERE username = $1', [login]);
        await conn.end();

        if (result.rows.length > 0) {
            return true;
        } else {
            return false;
        }

    }catch (errors) {
        console.error(errors);
        return;
    }
}

export default async function ChangeLogin(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        try {
            const { login } = await validationSchema.validate(req.body, {abortEarly: false});

            const usernameExist = await checkLoginExists(login);

            if (usernameExist) {
                return res.status(400).json({message: "This username already exists"});
            }

            const conn = await Connect();
            await conn.query('UPDATE users SET username = $1 WHERE id = $2', [login, req.body.id]);
            await conn.end();
            
            return res.status(200).json({message: "username updated successfully"});
        } catch (error) {
            if (error instanceof Yup.ValidationError) {
                const fieldErrors: Record<string, string> = {};
                error.inner.forEach((err) => {
                    const fieldName = err.path;
                    fieldErrors[fieldName] = err.message;
                })
                return res.status(400).json({ errors: fieldErrors });
            }
        }
        

    } else {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }
}