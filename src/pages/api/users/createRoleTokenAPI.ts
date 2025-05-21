"use server";
import { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";
import jwt from "jsonwebtoken";
import { supabase } from "@/lib/supabase/supabaseClient";

export default async function Login(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        try {
            const userID = req.body;

            const { data: userData, error } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", userID)
                .single();

            if (error) return res.status(400).json("User is not exist");
            const token = jwt.sign(
                { userRole: userData.role, profileAccess: false },
                process.env.SUPABASE_JWT_SECRET as string
            );
            const serializedCookie = serialize("roleToken", token, {
                httpOnly: false,
                sameSite: "strict",
                maxAge: 86400,
                path: "/",
            });

            res.setHeader("Set-cookie", serializedCookie);
            res.status(200).json({ message: "Login successful" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}
