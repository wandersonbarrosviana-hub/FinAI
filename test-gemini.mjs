
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBvGvoTk0cwElE7m8hhAwCEaRtEPeCcd6k";
const genAI = new GoogleGenerativeAI(API_KEY);

async function testModel(modelName) {
    console.log(`Testing model: ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log(`✅ Success with ${modelName}:`, response.text());
        return true;
    } catch (error) {
        console.error(`❌ Failed with ${modelName}:`, error.message);
        return false;
    }
}

async function run() {
    console.log("Starting API Test...");

    // Test the configured model
    const v2 = await testModel("gemini-2.0-flash");

    // If v2 fails, test v1.5 as fallback
    if (!v2) {
        console.log("\nRetrying with gemini-1.5-flash...");
        await testModel("gemini-1.5-flash");
    }
}

run();
