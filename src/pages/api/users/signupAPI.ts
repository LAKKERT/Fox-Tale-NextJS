"use server";
import Connect from "@/db/dbConfig";
import * as Yup from "yup";
import { v4 as uuidv4 } from "uuid";

const bcrypt = require("bcrypt");

const schema = Yup.object().shape({
    email: Yup.string().email('EMAIL is not correct server').required('Enter your EMAIL'),
    username: Yup.string().min(4, 'Username must be at least 4 characters').required('Enter your username'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Enter your password'),
    password2: Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match').required('Confirm your password')
});

async function checkEmailExists(email) {
    const conn = await Connect();
    const result = await conn.query('SELECT * FROM users WHERE email = $1', [email]);
    await conn.end();
    return result.rows.length > 0;
}

export default async function CreateUser(req, res) {
    if (req.method === "POST") {
        try {
            const { email, username, password } = await schema.validate(req.body, { abortEarly: false });

            const emailExist = await checkEmailExists(email);
            if (emailExist) {
                return res.status(400).json({ message: "Email already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const uniqueID = uuidv4();

            const conn = await Connect();

            await conn.query(`
                INSERT INTO users (id, email, username, password)
                VALUES ($1, $2, $3, $4)
            `, [uniqueID, email, username, hashedPassword]);

            await conn.end();

            return res.status(201).json({ message: "User created successfully", redirectUrl: '/' });

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
}