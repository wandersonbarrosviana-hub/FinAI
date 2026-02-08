const key = 'AIzaSyBFDD2FJnZWhNs6exUCIpsIADSztdwDMBk';
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`;

console.log("Testing REST API...");

async function test() {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: "Hello"
                    }]
                }]
            })
        });

        console.log("Status:", response.status, response.statusText);
        const data = await response.json();
        console.log("Data:", JSON.stringify(data, null, 2));

    } catch (err) {
        console.error("Fetch Error:", err);
    }
}

test();
