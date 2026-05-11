const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json()); // This allows the server to read JSON sent from your frontend

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        console.log("AVAILABLE MODELS:", data.models.map(m => m.name));
    } catch (e) {
        console.error("Could not list models:", e);
    }
}
listModels();

app.post('/grade', async (req, res) => {
    try {
        const { userWork } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        // We use the stable v1 endpoint directly
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `Grade this paragraph for ethics and clarity: ${userWork}` }]
                }]
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        // Gemini returns data in a deep nested object; this pulls the text out safely
        const aiFeedback = data.candidates[0].content.parts[0].text;
        
        res.json({ feedback: aiFeedback });

    } catch (error) {
        console.error("Manual Fetch Error:", error.message);
        res.status(500).json({ error: "The AI is having trouble connecting. Check your API key!" });
    }
});

app.listen(3000, () => console.log('Server is running on http://localhost:3000'));