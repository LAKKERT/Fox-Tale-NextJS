"use server";
import { NextApiRequest, NextApiResponse } from "next";
import Connect from "@/db/dbConfig";
import transporter from "@/helpers/nodeMailerConfig";
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

export default async function ChangeEmail(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        if (req.body.code === undefined) {
            try {
                const { newEmail } = await emailValidationSchema.validate(req.body, {abortEarly: false});
                
                const checkedEmail = await EmailExist(newEmail);
    
                const currentEmail = req.body.currentEmail;
                
                if(!checkedEmail) {
                    return res.status(400).json({emailExistMessage: "This email address already exists."});
                }
            
                const code = generateCode();
            
                const conn = await Connect();
    
                try {
                    await conn.query('UPDATE users SET verificationcode = $1 WHERE id = $2', [code, req.body.id]);
                    
                    const mailOptions = {
                        from: process.env.SMTP_USER,
                        to: currentEmail,
                        subject: "Email Verification",
                        text: `Your verification code is: ${code}`
                    }
    
                    try {
                        await transporter.sendMail(mailOptions);
                        return res.status(200).json({message: "Verification code sent successfully"});
                    }catch (error) {
                        console.error(error);
                        return res.status(500).json({message: "Failed to send verification code"});
                    }
                
                }catch(error) {
                    console.error(error);
                    return res.status(500).json({message: 'error creating code'});
                }finally {
                    await conn.end();
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
        else {
            try {
                const { code } = await codeValidationSchema.validate(req.body, {abortEarly: false});
                
                const conn = await Connect();
    
                try {
                    const result = await conn.query('SELECT verificationcode FROM users WHERE id = $1', [req.body.id]);
            
                    const verificationCode = result.rows[0].verificationcode;
            
                    if (verificationCode == code) {
                        const { newEmail } = req.body;
                        
                        try {
                            await conn.query('UPDATE users SET email = $1 WHERE id = $2', [newEmail, req.body.id]);
                            return res.status(200).json({successMessage: "Email changed successfully"});
                        }catch (error) {
                            console.error(error);
                            return res.status(500).json({message: 'error updating email'});
                        }
                    }else {
                        return res.status(400).json({codeIncorrectMessage: "Verification code is incorrect"});
                    }
                }catch (error) {
                    console.error(error);
                    return res.status(500).json({message: 'error verifying code'});
                }finally {
                    await conn.end();
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
    }else {
        return res.status(405).json({message: "Method not allowed"});
    }
}