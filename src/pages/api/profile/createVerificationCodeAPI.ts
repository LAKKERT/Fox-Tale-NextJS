import { NextApiRequest, NextApiResponse } from "next";
import Connect from '@/db/dbConfig';
import { v4 as uuidv4 } from "uuid";
import transporter from "@/helpers/nodeMailerConfig";
import jwt from 'jsonwebtoken';

function generateCode() {
    return Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
}

export default async function createVerificationCode(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('Authorization header is missing or invalid');
            return res.status(401).json({ error: 'Unauthorized' });
        }
    
        const token = authHeader.split(' ')[1];
    
        let decoded;

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET as string);
            if (decoded.profileAccess === true) {
                return res.status(201).json({ redirectUrl: `/profile/${decoded.userId}` });
            }
        } catch (error) {
            console.error("Invalid token:", error);
            return res.status(400).json({ error: "Invalid token" });
        }

        const userID = decoded?.userId;
        
        const {cookiesName, userEmail} = req.body;
        
        if (cookiesName === 'auth_token') {
    
            const code = generateCode();
    
            const conn = await Connect();
    
            try {
                await conn.query("UPDATE users SET verificationcode = $1 WHERE id = $2", [
                    code,
                    userID,
                ]);

                const mailOptions = {
                    from: process.env.SMTP_USER,
                    to: userEmail,
                    subject: "Verification Code",
                    html: `Your verification code is ${code}`
                }

                try {
                    await transporter.sendMail(mailOptions)
                    return res.status(200).json({message: 'Code was created', email: userEmail});
                }catch (error) {
                    console.error("Failed to send verification email:", error);
                    return res.status(500).json({message: 'Server error', redirectUrl: '/'});
                }
            } catch (error) {
                console.error(error);
                return res.status(500).json({message: 'Server error', redirectUrl: '/'})
    
            }finally {
                await conn.end();
            }

        }else if (cookiesName === 'regToken') {
            const userID = decoded?.userID;

            const userEmail = decoded?.email;
    
            const code = generateCode();

            const conn = await Connect();

            try {
                await conn.query("UPDATE users SET verificationcode = $1 WHERE id = $2", [
                    code,
                    userID,
                ]);
                
                const mailOptions = {
                    from: process.env.SMTP_USER,
                    to: userEmail,
                    subject: "Verification Code",
                    html: `Your verification code is ${code}`
                }
    
                try {
                    await transporter.sendMail(mailOptions);
                    return res.status(200).json({message: 'Code was created', email: userEmail});
                } catch (error) {
                    console.error("Failed to send verification email:", error);
                    return res.status(500).json({message: 'Server error', redirectUrl: '/'});
                }
    
            } catch (error) {
                console.error(error);
                return res.status(500).json({message: 'Server error', redirectUrl: '/'})
            }finally {
                await conn.end();
            }
        }
    } 
}