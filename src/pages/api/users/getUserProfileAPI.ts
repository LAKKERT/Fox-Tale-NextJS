'use server';

import Connect from "@/db/dbConfig";
import jwt from "jsonwebtoken";

export default async function getUserProfile(req, res) {
    if (req.method === 'GET') {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('Authorization header is missing or invalid');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch ( error ) {
            console.error('Invalid token');
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const { userID } = req.query
        const currentUser = decoded.userId;
        const currentUserRole = decoded.userRole;
        const accessProfile = decoded.accessProfile;

        if (currentUserRole === 'admin' || currentUser === userID) {
            const conn = await Connect();

            try {
                const result = await conn.query('SELECT * FROM users WHERE id = $1', [userID]);
                return res.status(200).json({ profile: result.rows[0], userRole: currentUserRole, accessProfile: accessProfile });
            }catch (error) {
                console.error('Error fetching user data', error);
                res.status(500).json({ error: 'Failed to fetch user data' })
            }finally {
                conn.end();
            }
        }

    }else {
        console.error('Method is not allowed');
        return res.status(401).end();
    }
}