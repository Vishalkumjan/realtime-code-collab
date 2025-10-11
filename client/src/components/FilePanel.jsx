// client/src/components/FilePanel.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { getSocket, safeEmit } from "../socket";
import toast from "react-hot-toast";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

const detectLanguage = (filename) => {
  const ext = filename.split(".").pop().toLowerCase();
  const langMap = {
    js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
    py: "python", java: "java", cpp: "cpp", c: "cpp", cs: "csharp",
    html: "html", css: "css", json: "json", md: "markdown",
    go: "go", rs: "rust", php: "php", rb: "ruby",
  };
  return langMap[ext] || "javascript";
};

export default function FilePanel({ roomId, currentUser, isOpen, onClose, onLoadFile }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (roomId) fetchFiles();
  }, [roomId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleFileUploaded = (data) => {
      const { file } = data;
      setFiles((prev) => {
        const existingIndex = prev.findIndex((f) => f.filename === file.filename);
        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex] = file;
          return updated;
        }
        return [...prev, file];
      });
      toast.success(`${file.uploadedBy} uploaded ${file.filename}`);
    };

    const handleFileDeleted = (data) => {
      const { filename } = data;
      setFiles((prev) => prev.filter((f) => f.filename !== filename));
      toast.info(`File deleted: ${filename}`);
    };

    const handleLoadFileToEditor = (data) => {
      const { content, language } = data;
      if (onLoadFile) {
        onLoadFile(content, language);
      }
    };

    socket.on("file-uploaded", handleFileUploaded);
    socket.on("file-deleted", handleFileDeleted);
    socket.on("load-file-to-editor", handleLoadFileToEditor);

    return () => {
      socket.off("file-uploaded", handleFileUploaded);
      socket.off("file-deleted", handleFileDeleted);
      socket.off("load-file-to-editor", handleLoadFileToEditor);
    };
  }, [onLoadFile]);

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/api/files/${roomId}`);
      if (res.data.success) {
        setFiles(res.data.files || []);
      }
    } catch (error) {
      console.error("Fetch files error:", error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target.result;
        const language = detectLanguage(file.name);

        const payload = {
          roomId,
          filename: file.name,
          content,
          language,
          uploadedBy: currentUser?.username || "Guest",
        };

        const res = await axios.post(`${SERVER_URL}/api/files/upload`, payload);

        if (res.data.success) {
          setFiles((prev) => {
            const existingIndex = prev.findIndex((f) => f.filename === file.name);
            if (existingIndex > -1) {
              const updated = [...prev];
              updated[existingIndex] = res.data.file;
              return updated;
            }
            return [...prev, res.data.file];
          });

          safeEmit("file-uploaded", { roomId, file: res.data.file });
          toast.success(`Uploaded: ${file.name}`);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleLoadFile = (file) => {
    if (onLoadFile) {
      onLoadFile(file.content, file.language);
      safeEmit("load-file-to-editor", {
        roomId,
        content: file.content,
        language: file.language,
      });
      toast.success(`Loaded: ${file.filename}`);
    }
  };

  const handleDeleteFile = async (filename) => {
    if (!confirm(`Delete ${filename}?`)) return;

    try {
      const res = await axios.delete(`${SERVER_URL}/api/files/${roomId}/${filename}`);
      if (res.data.success) {
        setFiles((prev) => prev.filter((f) => f.filename !== filename));
        safeEmit("file-deleted", { roomId, filename });
        toast.success(`Deleted: ${filename}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Delete failed");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* File Panel */}
      <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-dark-800 border-l border-gray-200 dark:border-dark-700 shadow-2xl z-40 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Files</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700"
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

        {/* Upload Button */}
        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
          <label className="block w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-center cursor-pointer transition-colors">
            {uploading ? "Uploading..." : "📤 Upload File"}
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
              accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.html,.css,.json,.md,.go,.rs,.php,.rb,.txt"
            />
          </label>
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {files.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
              No files uploaded
            </p>
          ) : (
            files.map((file, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                      {file.filename}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      by {file.uploadedBy} •{" "}
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleLoadFile(file)}
                      className="p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400"
                      title="Load to editor"
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
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.filename)}
                      className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
                      title="Delete"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-30"
        onClick={onClose}
      />
    </>
  );
}
