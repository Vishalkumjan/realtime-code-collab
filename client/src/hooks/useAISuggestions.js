// client/src/hooks/useAISuggestions.js
import { useRef, useCallback } from 'react';
import axios from 'axios';

export const useAISuggestions = () => {
    const debounceTimerRef = useRef(null);

    const fetchSuggestion = useCallback(async (code, language, line, column) => {
        try {
            const response = await axios.post('http://localhost:3001/api/ai/suggestions', {
                code,
                language,
                line,
                column
            });

            return response.data.suggestion;
        } catch (error) {
            console.error('Failed to fetch AI suggestion:', error);
            return null;
        }
    }, []);

    const debouncedFetchSuggestion = useCallback((code, language, line, column, callback) => {
        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer - wait 300ms after typing stops
        debounceTimerRef.current = setTimeout(async () => {
            const suggestion = await fetchSuggestion(code, language, line, column);
            if (suggestion && callback) {
                callback(suggestion);
            }
        }, 300);
    }, [fetchSuggestion]);

    return { debouncedFetchSuggestion, fetchSuggestion };
};