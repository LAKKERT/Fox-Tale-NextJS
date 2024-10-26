"use server";
import Connect from "@/db/dbConfig";
import transporter from "@/helpers/nodeMailerConfig";
import nodemailer from 'nodemailer';
import * as Yup from "yup";

function generateCode() {
    return Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
}

const emailValidationSchema = Yup.object().shape({
    newEmail: Yup.string().email('Email is not correct').required('Enter your new email'),
})

const codeValidationSchema = Yup.object().shape({
    code: Yup.number().min(1000, 'Number must be a 4-digit number').max(9999, 'Number must be a 4-digit number').typeError('Please enter a 4-digit number'),
})

async function EmailExist(newEmail) {
    try {
        const conn = await Connect() ;
        const result = await conn.query('SELECT email FROM users WHERE email = $1', [newEmail]);
        await conn.end();

        return result.rows.length === 0;

    } catch (error) {
        console.error(error);
        throw error;
    }
}

export default async function ChangeEmail(req, res) {
    if (req.body.code === undefined) {
        try {
            const { newEmail } = await emailValidationSchema.validate(req.body, {abortEarly: false});
            
            const checkedEmail = await EmailExist(newEmail);
            
            if(!checkedEmail) {
                return res.status(400).json({emailExistMessage: "This email address already exists."});
            }
        
            const code = generateCode();
        
            const conn = await Connect();
            await conn.query('UPDATE users SET verificationcode = $1 WHERE id = $2', [code, req.body.id]);
            await conn.end();
        
            return res.status(200).json({message: "Code sent successfully", email: newEmail});
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
        try {
            const { code } = await codeValidationSchema.validate(req.body, {abortEarly: false});
            
            const conn = await Connect();
            const result = await conn.query('SELECT verificationcode FROM users WHERE id = $1', [req.body.id]);
            await conn.end();
    
            const verificationCode = result.rows[0].verificationcode;
    
            if (verificationCode == code) {
                const { newEmail } = req.body;

                const conn = await Connect();
                await conn.query('UPDATE users SET email = $1 WHERE id = $2', [newEmail, req.body.id]);
                await conn.end();
                return res.status(200).json({successMessage: "Email changed successfully"});
            }else {
                return res.status(400).json({codeIncorrectMessage: "Verification code is incorrect"});
            }
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
    }
}