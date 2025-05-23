import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

transporter.verify((error) => {
    if (error) {
        console.log('Error with transporter:', error);
    } else {
        console.log('Transporter is ready to send emails');
    }
});

export default transporter;