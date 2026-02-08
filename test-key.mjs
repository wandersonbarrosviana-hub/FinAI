import { GoogleGenerativeAI } from '@google/generative-ai';

const key = 'AIzaSyBFDD2FJnZWhNs6exUCIpsIADSztdwDMBk';

console.log("Testing Key:", key ? "Present" : "Missing");

async function test() {
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent('Hello, are you working?');
        const response = await result.response;
        console.log("Success! Response:", response.text());
    } catch (err) {
        console.error("API Error:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    }
}

test();
