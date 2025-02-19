"use server";

import { Server } from "socket.io";
import { saveMessageToDB } from "@/pages/api/support/sendMessageAPI";

export default function WebSocketAPI(req, res) {
    if (req.socket.server.io) {
        res.end();
        return;
    }

    const io = new Server(res.socket.server, { path: "/api/support/socket" });
    res.socket.server.io = io;
    io.on("connection", (socket) => {
        socket.on("message", async (messageData) => {
            if (messageData.status === false) {
                try {
                    console.info("Message is added", messageData);

                    await saveMessageToDB(
                        messageData.content || null,
                        messageData.roomID,
                        messageData.user_id,
                        messageData.fileUrl || null
                    );

                    io.emit("message", {
                        ...messageData,
                        user_id: messageData.user_id,
                        file_url: messageData.fileUrl,
                        unreaded: true,
                    });

                } catch (error) {
                    console.error("Error saving message:", error);
                }
            } else {
                console.error("Chat is closed");
            }
        });

        socket.on("participants", async (participants) => {
            try {
                console.log("Participants updated:", participants);

                io.emit("participants", {
                    ...participants
                })
            }catch (error) {
                console.error("Error updating participants:", error);
            }
        })

        socket.on("disconnect", async (messageData) => {
            console.log("User disconnected");
        });
    });

    res.end();
}
