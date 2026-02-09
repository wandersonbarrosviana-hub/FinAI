
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const match = envContent.match(/VITE_GOOGLE_API_KEY=(.*)/);
const key = match ? match[1].trim() : '';

const genAI = new GoogleGenerativeAI(key);

async function testModel(modelName) {
    try {
        console.log(`Testing ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello');
        await result.response;
        console.log(`SUCCESS: ${modelName} is available.`);
        return true;
    } catch (error) {
        console.log(`FAILED: ${modelName} - ${error.message.split(' ').slice(0, 10).join(' ')}...`);
        return false;
    }
}

async function run() {
    console.log("Checking Pro Models...");
    await testModel('gemini-1.5-pro');
    await testModel('gemini-1.5-pro-latest');
    await testModel('gemini-pro');
    await testModel('gemini-2.0-pro-exp-02-05'); // Experimental pro
}

run();
