// client/src/components/DownloadButton.jsx - CREATE NEW FILE
import React from "react";
import toast from "react-hot-toast";

export default function DownloadButton({ code, filename = "code", language = "javascript" }) {
  const handleDownload = () => {
    if (!code || code.trim() === "") {
      toast.error("No code to download");
      return;
    }

    const ext = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      cpp: "cpp",
      csharp: "cs",
      html: "html",
      css: "css",
      json: "json",
      markdown: "md",
      go: "go",
      rust: "rs",
      php: "php",
      ruby: "rb",
    }[language] || "txt";

    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Downloaded: ${filename}.${ext}`);
  };

  return (
    <button
      onClick={handleDownload}
      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
      title="Download current code"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download
    </button>
  );
}