import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { ApiUrl } from '../configs';

export default function MentorDashboard() {
    const { token, user, loading: authLoading } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) return;

        const newSocket = io(ApiUrl, {
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
                `${ApiUrl}/booking`,
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
                `${ApiUrl}/booking/status/${bookingId}`,
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
                `${ApiUrl}/booking/status/${bookingId}`,
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
            return (
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-gray-600">Loading bookings...</span>
                    </div>
                </div>
            );
        }

        if (!bookings || bookings.length === 0) {
            return (
                <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No booking requests</h3>
                    <p className="mt-1 text-sm text-gray-500">You'll see booking requests here when learners book sessions with you.</p>
                </div>
            );
        }

        return bookings.map(booking => {
            console.log('Rendering booking:', {
                id: booking._id || booking.id,
                status: booking.status,
                isRequested: booking.status === 'requested',
                fullBooking: booking
            });
            return (
                <div key={booking._id || booking.id} className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-100 hover:shadow-lg transition-all duration-200">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <div className="flex items-center mb-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                                    {booking.learner?.username?.charAt(0)?.toUpperCase() || 'L'}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Session with {booking.learner?.username || 'Unknown Learner'}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {new Date(booking.date).toLocaleDateString('en-US', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-gray-700">{booking.slot}</span>
                                </div>
                                <div className="flex items-center">
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                        booking.status === 'requested' ? 'bg-yellow-100 text-yellow-800' :
                                        booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                            {booking.status === 'requested' && (
                                <>
                                    <button
                                        onClick={() => handleAcceptBooking(booking._id || booking.id)}
                                        className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleRejectBooking(booking._id || booking.id)}
                                        className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Reject
                                    </button>
                                </>
                            )}
                            {booking.status === 'confirmed' && (
                                <button
                                    onClick={() => handleJoinRoom(booking._id || booking.id)}
                                    className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
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
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">Mentor Dashboard</h1>
                            <p className="text-gray-600">Manage your mentorship sessions and learner requests</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/updates')}
                                className="flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Update Profile
                            </button>
                            <div className="bg-white p-3 rounded-lg shadow-md">
                                <div className="text-2xl font-bold text-green-600">{bookings.length}</div>
                                <div className="text-sm text-gray-500">Total Requests</div>
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-md">
                                <div className="text-2xl font-bold text-blue-600">
                                    {bookings.filter(b => b.status === 'confirmed').length}
                                </div>
                                <div className="text-sm text-gray-500">Confirmed</div>
                            </div>
                        </div>
                    </div>
                </div>

                {authLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-gray-600">Loading user data...</span>
                        </div>
                    </div>
                ) : !user ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-600">Please log in to view your dashboard</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Alerts */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-600">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {message && (
                            <div className={`mb-6 p-4 rounded-lg ${
                                messageType === 'success' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'
                            }`}>
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        {messageType === 'success' ? (
                                            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm">{message}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Booking Requests Section */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Booking Requests
                            </h2>
                            <div className="grid gap-6">
                                {renderBookings()}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}