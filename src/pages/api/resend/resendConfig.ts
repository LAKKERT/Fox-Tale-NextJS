'use server';
import { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

const resend = new Resend(RESEND_API_KEY);

export default async function ResendEmailTransporter(req: NextApiRequest, res: NextApiResponse) {
    const data = req.body;

    try {
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: ['lakkert2002@yandex.ru'],
            subject: 'hello world',
            html: `<p>it works! ${data.code}</p>`,
        })
        return res.status(200).json({message: 'The email was sent successfully'})
    }catch (error) {
        console.error('Error sending mail', error);
        return res.status(500).json({message: 'Error sending mail'})
    }
}