"use server";
import Connect from "@/db/dbConfig"
import transporter from "@/helpers/nodeMailerConfig";
import nodemailer from 'nodemailer';
import * as Yup from "yup";

const validationSchema = Yup.object().shape({
    email: Yup.string().email('Email is not correct').required('Enter your current email'),
    Newemail: Yup.string().email('Email is not correct').required('Enter your new email'),
})

async function EmailExist(userID ,email) {
    try {
        const conn = Connect() 
        const result = await conn.query('SELECT email FROM users WHERE id = 1$', [userID])
        await conn.end();

        if (!result.rows.length) {
            console.error("user not found");
            return false;
        }

    } catch (error) {
        console.error(error);
        throw error;
    }
}

export default async function ChangeEmail(req, res) {

    const { oldEmail, newEmail } = await validationSchema.validate(req.body, {abortEarly: false});

    const checkedEmail = await EmailExist(req.body.id, oldEmail);

    if(!checkedEmail) {
        return res.status(400).json({message: "Old email does not match"});
    }


    
    const mailOprions = {
        from: process.env.SMTP_USER,
        to: "new-email@example.com",
        subject: "Email Change Confirmation",
        text: "Please confirm your new email address by clicking the link below",
        html: `<a href="https://your-website.com/confirm-email?token=${token}">Confirm Email</a>`,
    }
}