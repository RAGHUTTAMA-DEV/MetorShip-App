import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function MentorDashboard() {
    const { token, user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Initialize socket connection
        const newSocket = io('https://metorship-app.onrender.com', {
            auth: {
                token
            }
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

    const fetchBookings = async () => {
        try {
            const response = await axios.get(
                'https://metorship-app.onrender.com/api/booking',
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        role: 'mentor',
                        mentorId: user?._id
                    }
                }
            );
            
            if (response.status === 200) {
                console.log('Fetched bookings:', response.data);
                setBookings(response.data.bookings || []);
            }
        } catch (err) {
            console.error("Error fetching bookings:", err);
            setError('Failed to load bookings');
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleAcceptBooking = async (bookingId) => {
        try {
            setLoading(true);
            setError('');

            console.log('Current bookings:', bookings);
            console.log('Attempting to accept booking with ID:', bookingId);
            console.log('Current user:', user);
            
            const booking = bookings.find(b => b.id === bookingId || b._id === bookingId);
            console.log('Found booking:', booking);

            if (!booking) {
                setError('Booking not found');
                return;
            }

            // Check if the current user is the mentor for this booking
            console.log('Comparing IDs:', {
                mentorId: booking.mentor.id || booking.mentor._id,
                userId: user.id || user._id,
                mentorIdType: typeof (booking.mentor.id || booking.mentor._id),
                userIdType: typeof (user.id || user._id)
            });

            if ((booking.mentor.id || booking.mentor._id) !== (user.id || user._id)) {
                setError('You are not authorized to accept this booking');
                return;
            }

            // Check if the user is a mentor
            if (user.role !== 'mentor') {
                setError('Only mentors can accept bookings');
                return;
            }

            const response = await axios.put(
                `https://metorship-app.onrender.com/api/booking/status/${bookingId}`,
                { 
                    status: 'confirmed'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                // Emit socket event for booking acceptance
                socket?.emit('accept', bookingId);
                // Refresh bookings
                await fetchBookings();
            }
        } catch (err) {
            console.error("Error accepting booking:", err);
            console.error("Error details:", {
                status: err.response?.status,
                data: err.response?.data,
                headers: err.response?.headers,
                request: {
                    url: err.config?.url,
                    method: err.config?.method,
                    headers: err.config?.headers,
                    data: err.config?.data
                }
            });
            setError(err.response?.data?.message || 'Failed to accept booking. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRejectBooking = async (bookingId) => {
        try {
            setLoading(true);
            setError('');

            console.log('Current bookings:', bookings);
            console.log('Attempting to reject booking with ID:', bookingId);
            console.log('Current user:', user);
            
            const booking = bookings.find(b => b.id === bookingId || b._id === bookingId);
            console.log('Found booking:', booking);

            if (!booking) {
                setError('Booking not found');
                return;
            }

            // Check if the current user is the mentor for this booking
            console.log('Comparing IDs:', {
                mentorId: booking.mentor.id || booking.mentor._id,
                userId: user.id || user._id,
                mentorIdType: typeof (booking.mentor.id || booking.mentor._id),
                userIdType: typeof (user.id || user._id)
            });

            if ((booking.mentor.id || booking.mentor._id) !== (user.id || user._id)) {
                setError('You are not authorized to reject this booking');
                return;
            }

            // Check if the user is a mentor
            if (user.role !== 'mentor') {
                setError('Only mentors can reject bookings');
                return;
            }

            const response = await axios.put(
                `https://metorship-app.onrender.com/api/booking/status/${bookingId}`,
                { 
                    status: 'rejected'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                // Emit socket event for booking rejection
                socket?.emit('reject', bookingId);
                // Refresh bookings
                await fetchBookings();
            }
        } catch (err) {
            console.error("Error rejecting booking:", err);
            console.error("Error details:", {
                status: err.response?.status,
                data: err.response?.data,
                headers: err.response?.headers,
                request: {
                    url: err.config?.url,
                    method: err.config?.method,
                    headers: err.config?.headers,
                    data: err.config?.data
                }
            });
            setError(err.response?.data?.message || 'Failed to reject booking. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Mentor Dashboard</h1>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                    {error}
                </div>
            )}

            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Booking Requests</h2>
                {bookings.length > 0 ? (
                    <div className="grid gap-4">
                        {bookings.map((booking) => (
                            <div key={booking.id || booking._id} className="p-4 bg-white rounded-lg shadow">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-medium">Session with {booking.learner?.username}</h3>
                                        <p className="text-gray-600">Date: {new Date(booking.date).toLocaleDateString()}</p>
                                        <p className="text-gray-600">Time: {booking.slot}</p>
                                        <p className="text-gray-600">Status: {booking.status}</p>
                                    </div>
                                    {booking.status === 'requested' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAcceptBooking(booking.id || booking._id)}
                                                disabled={loading}
                                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleRejectBooking(booking.id || booking._id)}
                                                disabled={loading}
                                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-400"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                    {booking.status === 'confirmed' && booking.sessionLink && (
                                        <a
                                            href={booking.sessionLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            Join Session
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600">No booking requests</p>
                )}
            </div>
        </div>
    );
}