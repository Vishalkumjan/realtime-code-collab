// client/src/components/ChatBox.jsx
import React, { useEffect, useRef, useState } from "react";
import { getSocket, safeEmit } from "../socket";

export default function ChatBox({ roomId, currentUser }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const scrollRef = useRef();
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !roomId) return;

    console.log("💬 Setting up chat listeners for room:", roomId);

    function onReceiveMessage(payload) {
      console.log("[chat] receive-message received", payload);
      
      const isSystem = payload.senderName === 'System';
      
      const display = {
        sender: isSystem ? "System" : (payload.senderName || "Guest"),
        text: payload.text || payload.message || "",
        timestamp: payload.createdAt || new Date().toISOString(),
        isSystem,
      };
      
      setMessages((prev) => [...prev, display]);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
      }, 0);
    }

    function onUserTyping(data) {
      const { username } = data;
      if (username !== currentUser?.username) {
        setTypingUsers(prev => {
          if (!prev.includes(username)) {
            return [...prev, username];
          }
          return prev;
        });
        
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u !== username));
        }, 3000);
      }
    }

    socket.off("chat-message");
    socket.off("user-joined");
    socket.off("user-left");
    socket.off("receive-message", onReceiveMessage);
    socket.off("user-typing", onUserTyping);
    
    socket.on("receive-message", onReceiveMessage);
    socket.on("user-typing", onUserTyping);

    setMessages([]);

    return () => {
      console.log("💬 Cleaning up chat listeners for room:", roomId);
      socket.off("receive-message", onReceiveMessage);
      socket.off("user-typing", onUserTyping);
    };
  }, [roomId, currentUser]);

  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    safeEmit("user-typing", { roomId, username: currentUser?.username });
    
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const sendMessage = () => {
    const msg = message.trim();
    if (!msg || !roomId) return;
    
    const socket = getSocket();
    if (!socket) {
      console.error("❌ Socket not available");
      return;
    }

    console.log("📤 Sending message:", msg, "to room:", roomId);

    const newMessage = { 
      sender: "You", 
      text: msg, 
      timestamp: new Date().toISOString(),
      isSystem: false,
    };
    
    setMessages((prev) => [...prev, newMessage]);
    setMessage("");

    safeEmit("send-message", { roomId, message: msg });

    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }
    }, 0);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-80 lg:h-96 p-4 flex flex-col">
      <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Chat
      </h3>
      
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto mb-3 p-3 bg-gray-50 dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-700 custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            No messages yet
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i} className="animate-fade-in">
                {m.isSystem ? (
                  <div className="text-xs text-gray-400 dark:text-gray-500 text-center italic py-1">
                    {m.text}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-xs font-semibold ${
                        m.sender === "You" 
                          ? "text-primary-600 dark:text-primary-400" 
                          : "text-green-600 dark:text-green-400"
                      }`}>
                        {m.sender}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-dark-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-700">
                      {m.text}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex gap-1">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
            <span>{typingUsers.join(", ")} typing...</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 transition-shadow"
          disabled={!roomId}
        />
        <button 
          onClick={sendMessage} 
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 rounded-lg text-white font-medium disabled:bg-gray-300 dark:disabled:bg-dark-600 disabled:cursor-not-allowed transition-colors"
          disabled={!message.trim() || !roomId}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}