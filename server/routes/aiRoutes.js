// server/routes/aiRoutes.js
const express = require('express');
const router = express.Router();

// Mock AI suggestions (since API key not available)
// In production, replace with actual OpenAI API call
const getMockSuggestion = (code, language) => {
    const suggestions = {
        javascript: [
            'const result = [];',
            'function handler() {\n  \n}',
            '.map(item => item)',
            '.filter(x => x)',
            'console.log()',
            'try {\n  \n} catch (error) {\n  \n}'
        ],
        python: [
            'result = []',
            'def function_name():',
            '    pass',
            'for item in items:',
            '    pass',
            'if condition:',
            '    pass',
            'try:',
            '    pass',
            'except Exception as e:',
            '    pass'
        ],
        cpp: [
            '#include <iostream>',
            '#include <vector>',
            'using namespace std;',
            'int main() {',
            '    return 0;',
            '}',
            'for (int i = 0; i < n; i++) {',
            '    ',
            '}'
        ],
        java: [
            'public class ClassName {',
            '    public static void main(String[] args) {',
            '    }',
            '}',
            'for (int i = 0; i < n; i++) {',
            '    ',
            '}'
        ],
        default: [
            '// TODO: Add implementation',
            'function() {',
            '}',
            'for (let i = 0; i < n; i++) {',
            '    ',
            '}'
        ]
    };

    const langSuggestions = suggestions[language] || suggestions.default;
    return langSuggestions[Math.floor(Math.random() * langSuggestions.length)];
};

router.post('/suggestions', async (req, res) => {
    try {
        const { code, language, line, column } = req.body;

        if (!code || !language) {
            return res.status(400).json({ error: 'Code and language required' });
        }

        // Extract context (50 lines before and after current line)
        const codeLines = code.split('\n');
        const contextStart = Math.max(0, line - 50);
        const contextEnd = Math.min(codeLines.length, line + 50);
        const context = codeLines.slice(contextStart, contextEnd).join('\n');

        // Get mock suggestion
        const suggestion = getMockSuggestion(context, language);

        res.json({
            suggestion,
            language,
            insertText: suggestion,
            kind: 'Snippet'
        });

    } catch (error) {
        console.error('AI Suggestions Error:', error);
        res.status(500).json({ error: 'Failed to generate suggestions' });
    }
});

module.exports = router;