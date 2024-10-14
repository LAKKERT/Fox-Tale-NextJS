"use server"
import Connect from "@/db/dbConfig";
export async function(req, res, userID) {
    const conn = await Connect();
    const result = await conn.query('SELECT * FROM users WHERE id = $1', [userID]);
    await conn.end();

}