"use server";
import { Server } from "socket.io";
import { saveMessageToDB } from "@/pages/api/support/sendMessageAPI";

export default function WebSocketAPI(req, res) {
    if (req.socket.server.io) {
        res.end();
        return;
    }

    const io = new Server(res.socket.server, {path: "/api/support/socket"});
    res.socket.server.io = io;

    io.on("connection", (socket) => {
        socket.on("message", async (messageData) => {
            console.info("Message is added", messageData);
            try {
                await saveMessageToDB(messageData.content, messageData.roomID, messageData.userID)
                io.emit("message", messageData);
            } catch (error) {
                console.error("Error saving message:", error);
            }
        })

        socket.on("disconnect", () => {
            console.log("User disconnected");
        })
    })

    res.end();
}