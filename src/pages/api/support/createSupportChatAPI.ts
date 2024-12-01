"use server";
import Connect from "@/db/dbConfig";
import * as Yup from "yup";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

const validationSchema = Yup.object().shape({
    title: Yup.string()
        .trim()
        .min(4, 'Title must be at least 4 characters')
        .max(100, 'Title cannot exceed 100 characters')
        .required('Please enter a title'),
    description: Yup.string()
        .trim()
        .min(10, 'The description must be at least 10 characters long')
        .max(400, 'The description should not be longer than 400 characters')
        .matches(/\S/, 'Description cannot be empty or whitespace')
        .required('Please explain your problem'),
    file: Yup.mixed()
});

export default async function CreateSupportChat(req, res) {
    if (req.method === 'POST') {
        try {
            const token = req.body.cookies.auth_token;
            console.log(token);
            let decoded 
            
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
                console.log("Create support chat")
            } catch (error) {
                return res.status(401).json({ message: 'Invalid token' });
            }
            
            const { title, description } = await validationSchema.validate(req.body, {abortEarly: false})
            const fileURL = req.body.files

            const userID = decoded.userId;
            const uniqueRoomID = uuidv4();
            const createdAt = new Date();
            
            const conn = await Connect();

            try {
                await conn.query('INSERT INTO chat_room (id, created_at, title, description, files, author) VALUES ($1, $2, $3, $4, $5, $6)', [uniqueRoomID, createdAt, title, description, fileURL, userID]);
                await conn.query('INSERT INTO participants (room_id, user_id) VALUES ($1, $2)', [uniqueRoomID, userID]);

                await conn.query('COMMIT');
                
                res.status(200).json({ message: "Support chat created successfully", redirectUrl: `/support/${uniqueRoomID}` });
            } catch (errors) {
                await conn.query('ROLLBACK');
                console.error("Database error:", errors);
                res.status(500).json({ message: "An error occurred while creating support chat"})
            } finally {
                await conn.end();
            }
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
        res.status(405).json({ message: "Method not allowed" });
    }
}