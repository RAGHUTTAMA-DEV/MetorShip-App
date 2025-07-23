import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Whiteboard from './Whiteboard';
import Webrtc from './Webrtc';
import { ApiUrl } from '../configs';

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
        const fetchRoomDetails = async () => {
            try {
                const response = await fetch(`${ApiUrl}/rooms/${roomId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch room details');
                }

                const data = await response.json();
                setRoom(data.room);
            } catch (err) {
                console.error('Error fetching room:', err);
                setError('Failed to load room details');
            } finally {
                setLoading(false);
            }
        };

        fetchRoomDetails();
        console.log("ApiUrl");
        const newSocket = io("http://localhost:3000", {
            auth: { token }
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
            setSocket(newSocket);
            newSocket.emit('room:join', roomId);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connect_error:', err);
            setError('Socket connection failed.');
        });

        newSocket.on('error', (error) => {
            console.error('Socket error:', error);
            setError(error);
        });

        newSocket.on('room:userJoined', (data) => {
            console.log('User joined:', data);
            setMessages(prev => [...prev, {
                type: 'system',
                content: `${data.username} joined the room`,
                timestamp: new Date()
            }]);
        });

        newSocket.on('room:userLeft', (data) => {
            console.log('User left:', data);
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

        return () => {
            newSocket.emit('room:leave', roomId);
            newSocket.disconnect();
        };
    }, [token, roomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        if (!socket || !socket.connected) {
            setError('Socket not connected. Cannot send message.');
            return;
        }
        console.log('Emitting chat:message', { roomId, content: newMessage });
        socket.emit('chat:message', {
            roomId,
            content: newMessage,
            type: 'text'
        });
        setNewMessage('');
    };

    const handleEndSession = async () => {
        try {
            const response = await fetch(`${ApiUrl}/rooms/${roomId}/end`, {
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

    if (loading || !socket || !socket.connected) {
        return <div className="flex items-center justify-center h-screen text-gray-500">Connecting to room and socket...</div>;
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
        <div className="flex h-screen bg-gray-100">
            {/* Main content area */}
            <div className="flex-1 flex flex-col">
                {/* Room header */}
                <div className="bg-white p-4 shadow">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold">Room: {room?.name || roomId}</h1>
                        <button
                            onClick={handleEndSession}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            End Session
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex min-h-0">
                    {/* Whiteboard */}
                    <div className="flex-1 p-4 min-h-0">
                        <div className="h-full w-full">
                            <Whiteboard socket={socket} />
                        </div>

                        <div>
                            <Webrtc socket={socket} roomId={roomId} room={room} user={user} />
                        </div>
                       
                    </div>
                    <div className="w-80 bg-white shadow-lg flex flex-col min-h-0">
                        <div className="p-4 border-b">
                            <h2 className="text-lg font-semibold">Chat</h2>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`mb-4 ${
                                        message.type === 'system'
                                            ? 'text-gray-500 text-sm'
                                            : message.sender === user?.id
                                            ? 'text-right'
                                            : ''
                                    }`}
                                >
                                    {message.type === 'system' ? (
                                        <div className="text-center text-gray-500 text-sm">
                                            {message.content}
                                        </div>
                                    ) : (
                                        <div
                                            className={`inline-block p-2 rounded-lg ${
                                                message.sender === user?.id
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-200'
                                            }`}
                                        >
                                            <div className="text-sm font-semibold">
                                                {message.sender === user?.id ? 'You' : message.senderName}
                                            </div>
                                            <div>{message.content}</div>
                                            <div className="text-xs opacity-75">
                                                {new Date(message.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 border-t">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
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
        </div>
    );
} 

