"use server";
import Connect from "@/db/dbConfig";
import * as Yup from "yup";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import transporter from "@/helpers/nodeMailerConfig";

export async function getRegistrationUserData(cookies) {
    const token = await cookies.regToken;

    if (!token) {
        return { error: "Unauthorized", redirectUrl: '/signup' };
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    }catch (errors) {
        console.error("Invalid token get pre:", errors);
        return { error: "Invalid token" };
    }
}

const validationSchema = Yup.object().shape({
    code: Yup.number()
        .min(1000, "Number must be a 4-digit number")
        .max(9999, "Number must be a 4-digit number")
        .typeError("Please enter a 4-digit number"),
});

function generateCode() {
    return Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
}

export async function createVerificationCode(cookies) {
    let token;
    if (cookies.auth_token) {
        token = cookies.auth_token;
        if (!token) {
            return { error: "Unauthorized" };
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.profileAccess === true) {
                return { redirectUrl: `/profile/${decoded.userId}` };
            }
        } catch (error) {
            console.error("Invalid token:", error);
            return { error: "Invalid token" };
        }

        const userID = decoded.userId;

        try {
            const code = generateCode();

            const conn = await Connect();
            await conn.query("UPDATE users SET verificationcode = $1 WHERE id = $2", [
                code,
                userID,
            ]);
            await conn.end();

        } catch (error) {
            console.error(error);
        }
    } else if (cookies.regToken) {
        token = cookies.regToken;

        if (!token) {
            return { error: "Unauthorized" };
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            console.error("Invalid token:", error);
            return { error: "Invalid token" };
        }

        const userID = decoded.userID;
        const userEmail = decoded.email;

        try {
            const code = generateCode();

            const conn = await Connect();
            await conn.query("UPDATE users SET verificationcode = $1 WHERE id = $2", [
                code,
                userID,
            ]);
            await conn.end();

            // const mailOptions = {
            //     from: process.env.SMTP_USER,
            //     to: userEmail,
            //     subject: "Verification Code",
            //     html: `Your verification code is ${code}`
            // }

            // try {
            //     await transporter.sendMail(mailOptions);
            // } catch (error) {
            //     console.error("Failed to send verification email:", error);
            // }

            return code;
        } catch (error) {
            console.error(error);
        }
    }
}

export default async function VerifyUser(req, res) {
    if (req.method === "POST") {
        try {
            const { code, cookies } = await validationSchema.validate(req.body, {
                abortEarly: false,
            });

            const token = cookies.auth_token;
            
            if (!token) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (error) {
                console.error("Invalid token:", error);
                return res.status(401).json({ message: "Unauthorized" });
            }
            
            const userID = decoded.userId;
            
            const conn = await Connect()
            const result = await conn.query('SELECT verificationcode FROM users WHERE id = $1', [userID])
            await conn.end()

            if (result.rows[0].verificationcode == code) {
                decoded.profileAccess = true;
            } else {
                console.error("Incorrect verification code");
                return res.status(401).json({ message: "Incorrect verification code" });
            }

            const updateToken = jwt.sign(decoded, process.env.JWT_SECRET);

            const serializedCookie = serialize("auth_token", updateToken, {
                httpOnly: false,
                sameSite: "strict",
                maxAge: 86400,
                path: "/",
            });

            res.setHeader("Set-cookie", serializedCookie);

            res.status(200).json({
                    message: "Verified",
                    access: true,
                    redirectUrl: `/profile/${userID}`,
                });
        } catch (error) {
            if (error instanceof Yup.ValidationError) {
                const fieldErrors: Record<string, string> = {};
                error.inner.forEach((err) => {
                    const fieldName = err.path;
                    fieldErrors[fieldName] = err.message;
                });
                res
                    .status(400)
                    .json({ message: "Validation error", errors: fieldErrors });
            } else {
                res.status(400).json({ message: (error as Error).message });
            }
        }
    } else {
        console.error("Method not allowed");
        return res.status(405).json({ message: "method not allowed" });
    }
}
