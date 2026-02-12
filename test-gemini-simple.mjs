
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "YOUR_API_KEY_HERE";
const genAI = new GoogleGenerativeAI(API_KEY);

async function run() {
    console.log("Testing gemini-1.5-flash...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Hello");
        const response = await result.response;
        console.log("SUCCESS:", response.text());
    } catch (error) {
        console.error("ERROR Full:", JSON.stringify(error, null, 2));
        console.error("ERROR Message:", error.message);
    }
}

run();
