import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

export default function Room() {
    const { token, user } = useAuth();
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [room, setRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!roomId) {
            setError('Invalid room ID');
            setLoading(false);
            return;
        }

        // Fetch room details
        const fetchRoomDetails = async () => {
            try {
                const response = await fetch(`https://metorship-app.onrender.com/api/rooms/${roomId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch room details');
                }

                const data = await response.json();
                setRoom(data.room);

                // Join socket room
                if (socket) {
                    socket.emit('room:join', roomId);
                }
            } catch (err) {
                console.error('Error fetching room:', err);
                setError('Failed to load room details');
            } finally {
                setLoading(false);
            }
        };

        fetchRoomDetails();

        // Initialize socket connection
        const newSocket = io('https://metorship-app.onrender.com', {
            auth: { token }
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
            // Join the room
            newSocket.emit('room:join', roomId);
        });

        newSocket.on('error', (error) => {
            console.error('Socket error:', error);
            setError(error);
        });

        newSocket.on('room:userJoined', (data) => {
            console.log('User joined:', data);
            // Add system message
            setMessages(prev => [...prev, {
                type: 'system',
                content: `${data.username} joined the room`,
                timestamp: new Date()
            }]);
        });

        newSocket.on('room:userLeft', (data) => {
            console.log('User left:', data);
            // Add system message
            setMessages(prev => [...prev, {
                type: 'system',
                content: `${data.username} left the room`,
                timestamp: new Date()
            }]);
        });

        newSocket.on('chat:history', (history) => {
            console.log('Chat history:', history);
            setMessages(history);
        });

        newSocket.on('chat:newMessage', (message) => {
            console.log('New message:', message);
            setMessages(prev => [...prev, message]);
        });

        setSocket(newSocket);

        return () => {
            newSocket.emit('room:leave', roomId);
            newSocket.disconnect();
        };
    }, [token, roomId]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        socket?.emit('chat:message', {
            roomId,
            content: newMessage,
            type: 'text'
        });

        setNewMessage('');
    };

    const handleEndSession = async () => {
        try {
            const response = await fetch(`https://metorship-app.onrender.com/api/rooms/${roomId}/end`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                navigate('/dashboard');
            } else {
                setError('Failed to end session');
            }
        } catch (err) {
            console.error('Error ending session:', err);
            setError('Failed to end session');
        }
    };

    if (loading) {
        return <div>Loading room...</div>;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-red-500 text-center">
                    <h2 className="text-xl font-semibold mb-2">Error</h2>
                    <p>{error}</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!room) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">Room Not Found</h2>
                    <p className="text-gray-600 mb-4">The requested room could not be found.</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen">
            {/* Video Section */}
            <div className="flex-1 p-4">
                <div className="bg-gray-800 rounded-lg h-full flex flex-col">
                    <div className="flex-1 relative">
                        {/* Video container */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <iframe
                                src={room.sessionLink}
                                className="w-full h-full"
                                allow="camera; microphone; fullscreen; speaker"
                            />
                        </div>
                    </div>
                    <div className="p-4 bg-gray-900">
                        <button
                            onClick={handleEndSession}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            End Session
                        </button>
                    </div>
                </div>
            </div>

            {/* Chat Section */}
            <div className="w-80 bg-white border-l">
                <div className="h-full flex flex-col">
                    {/* Chat header */}
                    <div className="p-4 border-b">
                        <h2 className="text-lg font-semibold">Chat</h2>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {messages.map((message, index) => (
                            <div
                                key={`${message.timestamp}-${index}`}
                                className={`mb-4 ${
                                    message.type === 'system'
                                        ? 'text-center text-gray-500 text-sm'
                                        : message.sender._id === user._id
                                        ? 'text-right'
                                        : 'text-left'
                                }`}
                            >
                                {message.type !== 'system' && (
                                    <div className="text-xs text-gray-500 mb-1">
                                        {message.sender.username}
                                    </div>
                                )}
                                <div
                                    className={`inline-block p-2 rounded-lg ${
                                        message.type === 'system'
                                            ? 'bg-gray-100'
                                            : message.sender._id === user._id
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200'
                                    }`}
                                >
                                    {message.content}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message input */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            >
                                Send
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
} 