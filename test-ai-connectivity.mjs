import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

async function testConnectivity() {
    console.log("--- FinAI AI Connectivity Test ---");

    let envContent = "";
    try {
        envContent = fs.readFileSync('.env.local', 'utf-8');
    } catch (e) {
        console.warn("Could not read .env.local, checking process.env...");
    }

    const getEnv = (key) => {
        const match = envContent.match(new RegExp(`${key}=(.*)`));
        return match ? match[1].trim() : process.env[key] || "";
    };

    const googleKey = getEnv('VITE_GOOGLE_API_KEY');
    const groqKey = getEnv('VITE_GROQ_API_KEY');

    console.log("Gemini Key:", googleKey ? "PRESENT" : "MISSING");
    console.log("Groq Key:", groqKey ? "PRESENT" : "MISSING");

    if (googleKey) {
        console.log("\nTesting Gemini...");
        try {
            const genAI = new GoogleGenerativeAI(googleKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const result = await model.generateContent("Hello");
            console.log("Gemini Success!");
        } catch (e) {
            console.error("Gemini Failed:", e.message);
        }
    }

    if (groqKey) {
        console.log("\nTesting Groq...");
        try {
            const groq = new OpenAI({
                apiKey: groqKey,
                baseURL: "https://api.groq.com/openai/v1"
            });
            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: "user", content: "Hello" }],
                model: "llama-3.3-70b-versatile",
            });
            console.log("Groq Success!");
        } catch (e) {
            console.error("Groq Failed:", e.message);
        }
    }
}

testConnectivity();
