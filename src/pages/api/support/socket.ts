"use server";

import fs from "fs";
import path from "path";
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
            
            try {
                // let imageUrl = null;

                let imageUrl = [];
                
                console.info("Message is added", messageData);

                if (messageData.file) {
                    for (let i = 0; i < messageData.file.length; i++) {
                        const base64Data = messageData.file[i].replace(/^data:.+;base64,/, "");
                        console.log("Base64 Data:", base64Data); 
                        console.log(messageData.fileProperties[i].name, messageData.fileProperties[i].extenstion)
                        const buffer = Buffer.from(base64Data, "base64");
    
                        const fileName = `${Date.now()}_${messageData.fileProperties[i].name}.${messageData.fileProperties[i].extenstion}`;
                        const filePath = path.join(process.cwd(), "public", "uploads", fileName);
    
                        console.log("File Path:", filePath);
                        console.log("Buffer:", buffer);
    
                        fs.writeFileSync(filePath, buffer);
                        console.log("File saved:", filePath);
    
                        imageUrl.push(`/uploads/${fileName}`);
    
                        console.log("Image URL:", imageUrl);
                    }
                }
                await saveMessageToDB(messageData.content || null, messageData.roomID, messageData.userID, imageUrl || null)
                // io.emit("message", messageData);
                io.emit("message", {...messageData, file_url: imageUrl});
            } catch (error) {
                console.error("Error saving message:", error);
            }
        })

        socket.on("disconnect", async (messageData) => {
            console.info("Message is added ERROR", messageData);
            console.log("User disconnected");
        })
    })

    res.end();
}