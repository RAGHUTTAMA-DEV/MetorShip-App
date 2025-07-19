import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

export default function MentorDashboard() {
    const { token, user, loading: authLoading } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const navigate = useNavigate();

    // Socket connection
    useEffect(() => {
        if (!token) return;

        const newSocket = io('https://metorship-app.onrender.com', {
            auth: { token }
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
        });

        newSocket.on('error', (error) => {
            console.error('Socket error:', error);
            setError('Connection error. Please refresh the page.');
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [token]);

    // Fetch bookings
    const fetchBookings = useCallback(async () => {
        if (!token || !user?.id) {
            console.log('Missing token or user ID:', { token: !!token, userId: user?.id });
            return;
        }

        try {
            setLoading(true);
            console.log('Fetching bookings with params:', {
                role: 'mentor',
                mentorId: user.id
            });

            const response = await axios.get(
                'https://metorship-app.onrender.com/api/booking',
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        role: 'mentor',
                        mentorId: user.id
                    }
                }
            );
            
            console.log('Bookings response:', response.data);
            
            if (response.status === 200) {
                const bookingsData = response.data.bookings || [];
                console.log('Setting bookings:', bookingsData);
                setBookings(bookingsData);
            }
        } catch (err) {
            console.error("Error fetching bookings:", err.response?.data || err.message);
            setError('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    }, [token, user?.id]);

    // Initial fetch
    useEffect(() => {
        if (!authLoading && user?.id) {
            console.log('Effect triggered with:', { token: !!token, userId: user?.id });
            fetchBookings();
        }
    }, [fetchBookings, authLoading, user?.id]);

    const handleAcceptBooking = async (bookingId) => {
        try {
            console.log('Accepting booking:', bookingId);
            const response = await axios.put(
                `https://metorship-app.onrender.com/api/booking/status/${bookingId}`,
                {
                    status: 'confirmed',
                    mentorId: user.id
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Accept response:', response.data);

            if (response.status === 200) {
                socket?.emit('accept', bookingId);
                await fetchBookings();
                setMessage('Booking accepted successfully');
                setMessageType('success');
            }
        } catch (err) {
            console.error('Error accepting booking:', err.response?.data || err.message);
            setMessage(err.response?.data?.message || 'Failed to accept booking');
            setMessageType('error');
        }
    };

    const handleRejectBooking = async (bookingId) => {
        try {
            setLoading(true);
            setError('');
            console.log('Rejecting booking:', bookingId);

            const response = await axios.put(
                `https://metorship-app.onrender.com/api/booking/status/${bookingId}`,
                { 
                    status: 'rejected',
                    mentorId: user.id
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Reject response:', response.data);

            if (response.status === 200) {
                socket?.emit('reject', bookingId);
                await fetchBookings();
                setMessage('Booking rejected successfully');
                setMessageType('success');
            }
        } catch (err) {
            console.error("Error rejecting booking:", err.response?.data || err.message);
            setError(err.response?.data?.message || 'Failed to reject booking');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async (bookingId) => {
        try {
            setLoading(true);
            setError('');
            
            const booking = bookings.find(b => b._id === bookingId || b.id === bookingId);
            if (!booking?.roomId) {
                setError('Room not found for this booking');
                return;
            }
            
            navigate(`/room/${booking.roomId}`);
        } catch (err) {
            console.error('Error joining room:', err);
            setError('Failed to join room');
        } finally {
            setLoading(false);
        }
    };

    const renderBookings = () => {
        console.log('Rendering bookings:', bookings);
        
        if (loading) {
            return <div>Loading bookings...</div>;
        }

        if (!bookings || bookings.length === 0) {
            return <div>No bookings found</div>;
        }

        return bookings.map(booking => {
            console.log('Rendering booking:', {
                id: booking._id || booking.id,
                status: booking.status,
                isRequested: booking.status === 'requested',
                fullBooking: booking
            });
            return (
                <div key={booking._id || booking.id} className="bg-white p-4 rounded-lg shadow mb-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold">{booking.learner?.username || 'Unknown Learner'}</h3>
                            <p className="text-gray-600">Date: {new Date(booking.date).toLocaleDateString()}</p>
                            <p className="text-gray-600">Time: {booking.slot}</p>
                            <p className="text-gray-600">Status: {booking.status}</p>
                        </div>
                        <div className="flex gap-2">
                            {booking.status === 'requested' && (
                                <>
                                    <button
                                        onClick={() => handleAcceptBooking(booking._id || booking.id)}
                                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleRejectBooking(booking._id || booking.id)}
                                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                    >
                                        Reject
                                    </button>
                                </>
                            )}
                            {booking.status === 'confirmed' && (
                                <button
                                    onClick={() => handleJoinRoom(booking._id || booking.id)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Join Room
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Mentor Dashboard</h1>

            {authLoading ? (
                <div>Loading user data...</div>
            ) : !user ? (
                <div className="text-red-600">Please log in to view your dashboard</div>
            ) : (
                <>
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className={`mb-4 p-4 rounded-md ${
                            messageType === 'success' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'
                        }`}>
                            {message}
                        </div>
                    )}

                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Booking Requests</h2>
                        {loading ? (
                            <div>Loading bookings...</div>
                        ) : bookings.length > 0 ? (
                            <div className="grid gap-4">
                                {renderBookings()}
                            </div>
                        ) : (
                            <p className="text-gray-600">No booking requests</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}