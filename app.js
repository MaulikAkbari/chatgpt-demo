const express = require("express");
const { OpenAI } = require("openai");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require('dotenv');
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});
// Initialize Express and Socket.io
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// Chat message handling
io.on("connection", (socket) => {
  console.log("A user connected");

  const messageLog = [
    { role: "system", content: "You are a helpful assistant." },
  ];

  socket.on("userMessage", async (userInput) => {
    try {
      // Add user input to the message log
      messageLog.push({ role: "user", content: userInput });

      // Get response from OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messageLog,
        max_tokens: 16384,
        temperature: 0.7,
      });

      const aiResponse = response.choices[0].message.content;
      messageLog.push({ role: "assistant", content: aiResponse });

      // Send AI response back to the client
      socket.emit("botMessage", aiResponse);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      socket.emit("botMessage", "Sorry, something went wrong.");
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
