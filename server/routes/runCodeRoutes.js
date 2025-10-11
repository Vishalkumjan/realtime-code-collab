// server/routes/runCodeRoutes.js
const express = require('express');
const router = express.Router();
const axios = require('axios'); // Install 'axios' for API calls
console.log("✅ runCodeRoutes loaded"); 
// Jdoodle Credentials (Replace with your actual credentials!)
// Note: Never hardcode sensitive keys. Use environment variables.
const CLIENT_ID = process.env.JDOODLE_CLIENT_ID || 'YOUR_JDOODLE_CLIENT_ID';
const CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET || 'YOUR_JDOODLE_CLIENT_SECRET';

// Function to map our editor languages to Jdoodle's language names
const getJdoodleLanguage = (editorLang) => {
    const langMap = {
        // Versions changed to single index strings for higher Jdoodle compatibility (Fixes 404)
        javascript: { name: 'nodejs', version: '4' }, // Safest NodeJS index
        python: { name: 'python3', version: '4' },    // Safest Python3 index
        java: { name: 'java', version: '4' },         // Safest Java index
        cpp: { name: 'cpp', version: '4' },           // Safest C++ index
        c: { name: 'c', version: '4' },               // Safest C index
        // Add more languages as needed
    };
    return langMap[editorLang.toLowerCase()] || { name: 'nodejs', version: '4' }; // Default to nodejs
};


router.post('/execute', async (req, res) => {
    const { code, language, input } = req.body;

    if (!code || !language) {
        return res.status(400).json({ error: 'Code and language are required.' });
    }

    const jdoodleLang = getJdoodleLanguage(language);

    const program = {
        script: code,
        language: jdoodleLang.name,
        versionIndex: jdoodleLang.version,
        stdin: input || '', // User input for the program
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
    };

    try {
        // console.log("Jdoodle Payload:", program); // Optional: for debugging
        const response = await axios({
            method: 'POST',
            url: 'https://api.jdoodle.com/v1/execute', // Jdoodle API endpoint
            data: program,
            headers: { 'Content-Type': 'application/json' }
        });

        // Jdoodle returns output, memory, cpuTime, and statusCode
        res.json({
            output: response.data.output,
            status: response.data.statusCode,
            memory: response.data.memory,
            cpuTime: response.data.cpuTime
        });

    } catch (error) {
        // Log the actual status code from Jdoodle for better debugging
        const status = error.response ? error.response.status : 500;
        console.error('Jdoodle API Error:', error.message, 'Status:', status);
        res.status(status).json({ error: `Failed to execute code: Request failed with status code ${status}` });
    }
});

module.exports = router;