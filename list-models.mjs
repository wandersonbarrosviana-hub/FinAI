const key = 'AIzaSyBFDD2FJnZWhNs6exUCIpsIADSztdwDMBk';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

console.log("Listing Models...");

async function list() {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error("Error:", response.status, response.statusText);
            const txt = await response.text();
            console.error(txt);
            return;
        }
        const data = await response.json();
        const fs = await import('fs');
        fs.writeFileSync('models.json', JSON.stringify(data, null, 2));
        console.log("Models saved to models.json");

    } catch (err) {
        console.error("Fetch Error:", err);
    }
}

list();
