import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAISuggestions } from "./hooks/useAISuggestions"; // 🆕 Added
import Editor from "@monaco-editor/react";
import axios from "axios";
import { getSocket, connectSocketWithToken, safeEmit } from "./socket";
import JoinRoom from "./components/JoinRoom";
import ChatBox from "./components/ChatBox";
import UserList from "./components/UserList";
import ThemeToggle from "./components/ThemeToggle";
import { useTheme } from "./contexts/ThemeContext";
import FilePanel from "./components/FilePanel";
import DownloadButton from "./components/DownloadButton";
import OutputPanel from "./components/OutputPanel"; // 🆕 New Import

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "markdown", label: "Markdown" },
];

export default function RealtimeEditor() {
  const [roomId, setRoomId] = useState(null);
  const [localName, setLocalName] = useState(null);
  const [localColor, setLocalColor] = useState(null);
  const [users, setUsers] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFilePanelOpen, setIsFilePanelOpen] = useState(false);
  const [language, setLanguage] = useState("javascript");

  const [userInput, setUserInput] = useState("");

  const [isOutputPanelOpen, setIsOutputPanelOpen] = useState(false);
  const [executionResult, setExecutionResult] = useState({
    output: "",
    cpuTime: "",
    memory: "",
  });
  const [isRunning, setIsRunning] = useState(false);

  // 🆕 AI Suggestion States (new button system)
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const { fetchSuggestion, debouncedFetchSuggestion } = useAISuggestions();

  const { theme } = useTheme();
  const editorRef = useRef(null);
  const codeRef = useRef("");
  const applyingRemoteRef = useRef(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const handleJoin = ({ roomId: rid, username, color }) => {
    setRoomId(rid);
    setLocalName(username);
    setLocalColor(color);

    connectSocketWithToken(token);
    const socket = getSocket();

    const doJoin = () => {
      console.log("Joining room:", rid, "with username:", username);
      safeEmit("join-room", { roomId: rid, username, color });
    };

    if (socket.connected) {
      doJoin();
    } else {
      socket.once("connect", () => {
        console.log("Socket connected, now joining room");
        doJoin();
      });
      if (!socket.connecting && !socket.connected) {
        socket.connect();
      }
    }
  };

  const handleLeave = () => {
    const socket = getSocket();
    if (socket && roomId) {
      safeEmit("leave-room", { roomId });
    }
    setRoomId(null);
    setUsers([]);
    setLocalName(null);
    setLocalColor(null);
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    safeEmit("language-change", { roomId, language: newLanguage });
  };

  useEffect(() => {
    if (!roomId) return;

    const socket = getSocket();
    if (!socket) return;

    function onCodeChange(payload) {
      const { code, sender } = payload || {};
      if (!editorRef.current) return;
      if (sender === socket.id) return;

      applyingRemoteRef.current = true;
      const sel = editorRef.current.getSelection
        ? editorRef.current.getSelection()
        : null;

      editorRef.current.setValue(code || "");
      codeRef.current = code || "";

      try {
        if (sel && editorRef.current.setSelection)
          editorRef.current.setSelection(sel);
      } catch (e) {}
      applyingRemoteRef.current = false;
    }

    function onUsersUpdate(list) {
      console.log("✅ Received users-update:", list);
      setUsers(Array.isArray(list) ? list : []);
    }

    function onLoadCode(payload) {
      if (!editorRef.current) return;
      console.log("Loading initial code from server");
      applyingRemoteRef.current = true;

      const code = typeof payload === "string" ? payload : payload?.code || "";
      const lang = typeof payload === "object" ? payload?.language : null;

      editorRef.current.setValue(code);
      codeRef.current = code;
      if (lang) setLanguage(lang);

      applyingRemoteRef.current = false;
    }

    function onLanguageChange(payload) {
      const { language: newLang } = payload || {};
      if (newLang) {
        console.log("Language changed to:", newLang);
        setLanguage(newLang);
      }
    }

    socket.off("code-change").on("code-change", onCodeChange);
    socket.off("load-code").on("load-code", onLoadCode);
    socket.off("users-update").on("users-update", onUsersUpdate);
    socket.off("language-change").on("language-change", onLanguageChange);

    return () => {
      socket.off("code-change", onCodeChange);
      socket.off("load-code", onLoadCode);
      socket.off("users-update", onUsersUpdate);
      socket.off("language-change", onLanguageChange);
    };
  }, [roomId]);

  function handleEditorMount(editor, monaco) {
    editorRef.current = editor;

    editor.onDidChangeCursorSelection((e) => {
      if (!roomId) return;
      const sel = e.selection;
      if (!sel) return;
      const selection = {
        startLineNumber: sel.startLineNumber,
        startColumn: sel.startColumn,
        endLineNumber: sel.endLineNumber,
        endColumn: sel.endColumn,
      };
      safeEmit("cursor-change", { roomId, selection });
    });

    editor.onDidChangeModelContent(() => {
      if (applyingRemoteRef.current || !roomId) return;
      const code = editor.getValue();
      codeRef.current = code;
      console.log("Sending local code change to room:", roomId);
      safeEmit("code-change", { roomId, code });

      const position = editor.getPosition();
      if (position) {
        debouncedFetchSuggestion(
          code,
          language,
          position.lineNumber,
          position.column,
          (suggestion) => {
            setAiSuggestion(suggestion);
            console.log("💡 AI Suggestion:", suggestion);
          }
        );
      }
    });

    monaco.languages.registerCompletionItemProvider(language, {
      provideCompletionItems: () => {
        if (!aiSuggestion) return { suggestions: [] };
        return {
          suggestions: [
            {
              label: aiSuggestion.substring(0, 50) + "...",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: aiSuggestion,
              documentation: "AI Suggestion (Press Tab to accept)",
              sortText: "0_ai_suggestion",
            },
          ],
        };
      },
      triggerCharacters: [" ", "\n", ".", "("],
    });
  }

  const handleRunCode = useCallback(async () => {
    setIsRunning(true);
    setExecutionResult({ output: "Running...", cpuTime: "", memory: "" });
    setIsOutputPanelOpen(true);

    try {
      const response = await axios.post(
        "http://localhost:3001/api/run/execute",
        {
          code: codeRef.current,
          language,
          input: userInput || "",
        }
      );

      setExecutionResult({
        output: response.data.output,
        cpuTime: response.data.cpuTime,
        memory: response.data.memory,
      });
    } catch (error) {
      console.error("Code execution failed:", error);
      setExecutionResult({
        output: `Error executing code: ${
          error.response?.data?.error || error.message
        }`,
        cpuTime: "0",
        memory: "0",
      });
    } finally {
      setIsRunning(false);
    }
  }, [language, userInput]);

  // 🆕 HANDLE AI SUGGESTION BUTTON
  const handleGetAISuggestion = useCallback(async () => {
    setIsLoadingSuggestion(true);
    const position = editorRef.current?.getPosition();

    if (position && codeRef.current) {
      const suggestion = await fetchSuggestion(
        codeRef.current,
        language,
        position.lineNumber,
        position.column
      );

      if (suggestion) {
        setAiSuggestion(suggestion);
        console.log("💡 AI Suggestion:", suggestion);
      }
    }
    setIsLoadingSuggestion(false);
  }, [language, fetchSuggestion]);

  if (!roomId) {
    return <JoinRoom onJoin={handleJoin} />;
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50 dark:bg-dark-900">
      <div className="flex-1 flex flex-col">
        <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h1 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100">
                Room:{" "}
                <span className="text-primary-600 dark:text-primary-400">
                  {roomId}
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>

              {/* Files Button */}
              <button
                onClick={() => setIsFilePanelOpen(!isFilePanelOpen)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                title="Files"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Files
              </button>

              {/* 🆕 Run Code Button */}
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className={`px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 flex items-center ${
                  isRunning
                    ? "bg-yellow-600 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                }`}
                title="Run Code"
              >
                {isRunning ? (
                  <>
                    <svg
                      className="w-4 h-4 mr-1 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M12 4.75V3"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M17.126 6.874l-1.061 1.061"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M19 12h1.25"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M17.126 17.126l-1.061-1.061"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 19.25V21"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M7.935 16.065l-1.06 1.06"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M4.75 12H3"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M7.935 7.935l-1.06-1.06"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Running...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Run
                  </>
                )}
              </button>

              {/* 🆕 AI Suggestion Button */}
              <button
                onClick={handleGetAISuggestion}
                disabled={isLoadingSuggestion}
                className={`px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${
                  isLoadingSuggestion
                    ? "bg-purple-600 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
                title="Get AI Suggestion"
              >
                {isLoadingSuggestion ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="1" fill="currentColor" />
                    </svg>
                    Loading...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    AI
                  </>
                )}
              </button>

              <DownloadButton
                code={editorRef.current?.getValue() || ""}
                filename={roomId}
                language={language}
              />
              <ThemeToggle />
              <button
                onClick={handleLeave}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition-colors"
              >
                Leave
              </button>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 p-2 lg:p-4">
          <div className="h-full rounded-lg overflow-hidden border border-gray-200 dark:border-dark-700 shadow-lg">
            <Editor
              height="100%"
              language={language}
              theme={theme === "dark" ? "vs-dark" : "light"}
              onMount={handleEditorMount}
              options={{
                automaticLayout: true,
                minimap: { enabled: window.innerWidth > 768 },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                quickSuggestions: true,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: "on",
                tabCompletion: "on",
                wordBasedSuggestions: true,
                parameterHints: { enabled: true },
                suggest: {
                  showKeywords: true,
                  showSnippets: true,
                  showClasses: true,
                  showFunctions: true,
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Sidebar */}
<div
  className={`
    ${isSidebarOpen ? "translate-x-0" : "translate-x-full"}
    lg:translate-x-0 fixed lg:relative inset-y-0 right-0 z-30
    w-full sm:w-96 lg:w-80 xl:w-96
    bg-white dark:bg-dark-800 
    border-l border-gray-200 dark:border-dark-700
    flex flex-col
    transition-transform duration-300 ease-in-out
    shadow-xl lg:shadow-none
  `}
>
  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700 lg:hidden">
    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
      Collaboration
    </h2>
    <button
      onClick={() => setIsSidebarOpen(false)}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>

  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
    <div>
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
        Active Users
      </h3>
      <UserList
        users={users}
        currentUser={{ username: localName, color: localColor }}
      />
    </div>
  </div>

  <div className="border-t border-gray-200 dark:border-dark-700">
    <ChatBox
      roomId={roomId}
      currentUser={{ username: localName, color: localColor }}
    />
  </div>
</div>

{isSidebarOpen && (
  <div
    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
    onClick={() => setIsSidebarOpen(false)}
  />
)}

{/* AI Suggestion Popup */}
{aiSuggestion && (
  <div className="fixed bottom-4 left-4 lg:left-auto lg:right-4 z-40 bg-purple-900 border border-purple-500 rounded-lg shadow-2xl max-w-md">
    <div className="p-4">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-semibold text-purple-300">💡 AI Suggestion</h3>
        <button
          onClick={() => setAiSuggestion(null)}
          className="text-purple-400 hover:text-purple-200"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="bg-gray-800 rounded p-3 mb-3 text-xs text-gray-100 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
        {aiSuggestion}
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => {
            const editor = editorRef.current;
            if (editor && window.monaco) {
              const position = editor.getPosition();
              editor.executeEdits('ai-suggestion', [
                {
                  range: new window.monaco.Range(
                    position.lineNumber,
                    position.column,
                    position.lineNumber,
                    position.column
                  ),
                  text: aiSuggestion
                }
              ]);
              setAiSuggestion(null);
            }
          }}
          className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-colors"
        >
          Accept (Tab)
        </button>
        <button
          onClick={() => setAiSuggestion(null)}
          className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
        >
          Dismiss (Esc)
        </button>
      </div>
    </div>
  </div>
)}

      {/* Files Panel */}
    <FilePanel
  roomId={roomId}
  currentUser={{ username: localName }}
  isOpen={isFilePanelOpen}
  onClose={() => setIsFilePanelOpen(false)}
  onLoadFile={(content, lang) => {
    if (editorRef.current) {
      applyingRemoteRef.current = true;
      editorRef.current.setValue(content);
      setLanguage(lang);
      applyingRemoteRef.current = false;
    }
  }}
/>

      {/* Output Panel */}
    <OutputPanel
  isOpen={isOutputPanelOpen}
  onClose={() => setIsOutputPanelOpen(false)}
  output={executionResult.output}
  cpuTime={executionResult.cpuTime}
  memory={executionResult.memory}
  userInput={userInput}
  setUserInput={setUserInput}
  code={codeRef.current}
  language={language}
/>
    </div>
  );
}
