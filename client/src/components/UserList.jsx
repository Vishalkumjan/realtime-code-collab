// client/src/components/UserList.jsx
import React from "react";

function getInitials(username) {
  if (!username) return "?";
  const parts = username.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

export default function UserList({ users: propUsers, currentUser }) {
  const users = Array.isArray(propUsers) ? propUsers : [];

  return (
    <div className="space-y-2">
      {users.length === 0 ? (
        <div className="text-sm text-gray-400 dark:text-gray-500 text-center py-4 bg-gray-50 dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-700">
          No users online
        </div>
      ) : (
        users.map((u) => {
          const isCurrentUser = currentUser && u.username === currentUser.username;
          
          return (
            <div 
              key={u.id} 
              className="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors animate-fade-in"
            >
              {/* Avatar */}
              <div 
                className="relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md"
                style={{ background: u.color || "#666" }}
              >
                {getInitials(u.username)}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-dark-800 rounded-full"></div>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {u.username}
                  </p>
                  {isCurrentUser && (
                    <span className="text-xs px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded font-medium">
                      You
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Active now
                </p>
              </div>

              {/* Status Indicator */}
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-slow"></div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}