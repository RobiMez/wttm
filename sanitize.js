import fs from 'fs'
let data = []

// Assuming 'data' is the JavaScript array containing the objects

for (let i = 0; i < data.length; i++) {
    delete data[i].text_entities; // Remove the 'text_entities' field

    // Censor the 'text' field
    const originalText = data[i].text;
    const censoredText = '*'.repeat(originalText.length);
    data[i].text = censoredText;
}

// Convert the modified 'data' array to JSON string
const jsonData = JSON.stringify(data);

// Write the JSON data to a file
fs.writeFile('output.json', jsonData, (err) => {
    if (err) {
        console.error('Error writing to file:', err);
    } else {
        console.log('Data successfully written to output.json');
    }
});