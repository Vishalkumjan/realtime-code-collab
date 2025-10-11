// client/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { me } from "../api/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function Dashboard({ onAuth, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      me(token)
        .then((user) => {
          onAuth({ token, user });
          window.history.replaceState({}, document.title, "/dashboard");
        })
        .catch((err) => {
          console.error("Failed to fetch user data with token from URL:", err);
          onLogout();
        });
    }
  }, [location, onAuth, onLogout]);

  useEffect(() => {
    fetchMyRooms();
  }, []);

  const fetchMyRooms = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/rooms/user/my-rooms`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
      }
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteRoom = async (roomId) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/rooms/${roomId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setRooms(rooms.filter(r => r.roomId !== roomId));
      }
    } catch (err) {
      console.error("Failed to delete room:", err);
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-600 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            to="/editor"
            className="p-6 bg-green-600 rounded-lg hover:bg-green-700 transition-colors text-center"
          >
            <h2 className="text-2xl font-bold mb-2">Create New Room</h2>
            <p className="text-green-100">Start coding with others</p>
          </Link>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Your Rooms</h2>
          
          {loading ? (
            <p className="text-gray-400">Loading rooms...</p>
          ) : rooms.length === 0 ? (
            <p className="text-gray-400">No rooms yet. Create one to get started!</p>
          ) : (
            <div className="space-y-4">
              {rooms.map((room) => (
                <div
                  key={room._id}
                  className="bg-gray-700 rounded-lg p-4 flex justify-between items-center"
                >
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{room.name}</h3>
                    <p className="text-gray-400 text-sm">
                      Room ID: {room.roomId} | Language: {room.language}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {room.isPublic ? "Public" : "Private"} | 
                      Created: {new Date(room.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/editor?room=${room.roomId}`}
                      className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                    >
                      Open
                    </Link>
                    {room.owner?._id === localStorage.getItem("userId") && (
                      <button
                        onClick={() => deleteRoom(room.roomId)}
                        className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}