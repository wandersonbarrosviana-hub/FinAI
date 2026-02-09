
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const match = envContent.match(/VITE_GOOGLE_API_KEY=(.*)/);
const key = match ? match[1].trim() : '';

const genAI = new GoogleGenerativeAI(key);

async function run() {
    const modelName = 'gemini-1.5-pro-latest';
    console.log(`Testing ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello');
        await result.response;
        fs.writeFileSync('test_result.txt', `SUCCESS: ${modelName} available.`);
    } catch (error) {
        fs.writeFileSync('test_result.txt', `FAILED: ${modelName} - ${error.message}`);
    }
}

run();
