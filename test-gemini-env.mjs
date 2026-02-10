
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
console.log("Reading .env.local from:", envPath);

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/VITE_GOOGLE_API_KEY=(.*)/);
    const API_KEY = match ? match[1].trim() : "";

    console.log("API Key found (length):", API_KEY.length);
    console.log("API Key found (first 5 chars):", API_KEY.substring(0, 5));

    if (!API_KEY) {
        console.error("ERROR: No API Key found in .env.local");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(API_KEY);

    async function run() {
        console.log("Testing gemini-1.5-flash...");
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent("Hello, are you working?");
            const response = await result.response;
            console.log("SUCCESS:", response.text());
        } catch (error) {
            console.error("ERROR:", error.message);
        }
    }

    run();

} catch (e) {
    console.error("Failed to read .env.local:", e.message);
}
