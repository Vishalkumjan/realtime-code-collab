// client/src/components/OutputPanel.jsx
import React, { useState } from 'react';
import axios from 'axios';

const OutputPanel = ({ output, cpuTime, memory, onClose, isOpen, code, language }) => {
    const [userInput, setUserInput] = useState('');
    const [currentOutput, setCurrentOutput] = useState(output);
    const [currentCpuTime, setCurrentCpuTime] = useState(cpuTime);
    const [currentMemory, setCurrentMemory] = useState(memory);
    const [isRunning, setIsRunning] = useState(false);

    const handleKeyDown = async (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            // Ctrl+Enter to execute with input
            await executeCode();
        }
    };

    const executeCode = async () => {
        setIsRunning(true);
        setCurrentOutput('Running...');
        
        try {
            const response = await axios.post('http://localhost:3001/api/run/execute', {
                code,
                language,
                input: userInput || '',
            });

            setCurrentOutput(response.data.output);
            setCurrentCpuTime(response.data.cpuTime);
            setCurrentMemory(response.data.memory);
            setUserInput(''); // Clear input after execution
        } catch (error) {
            setCurrentOutput(`Error executing code: ${error.response?.data?.error || error.message}`);
            setCurrentCpuTime('0');
            setCurrentMemory('0');
        } finally {
            setIsRunning(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-70 flex justify-center items-center">
            <div className="bg-gray-800 w-full max-w-2xl mx-auto rounded-lg shadow-2xl">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h3 className="text-xl font-semibold text-green-400">Execution Result</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="p-4">
                    {/* Input Box */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Program Input (Ctrl+Enter to execute):
                        </label>
                        <textarea
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter input for the program (Ctrl+Enter to run)"
                            disabled={isRunning}
                            className="w-full p-3 bg-gray-700 text-white text-sm rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none resize-none disabled:opacity-50"
                            rows="3"
                        />
                        <p className="text-xs text-gray-500 mt-1">Tip: Press Ctrl+Enter to execute with input</p>
                    </div>

                    {/* Output Display */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Output:
                        </label>
                        <div className="p-3 bg-gray-700 text-white text-sm font-mono whitespace-pre-wrap max-h-64 overflow-y-auto rounded-lg border border-gray-600">
                            {currentOutput || "No output received."}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-700 text-xs text-gray-400 flex justify-between">
                    <span>Time: {currentCpuTime || 'N/A'}s</span>
                    <span>Memory: {currentMemory || 'N/A'}MB</span>
                </div>
            </div>
        </div>
    );
};

export default OutputPanel;