import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { ApiUrl } from '../configs';
import Review from "./Review";
import AllMentorsDetails from "./mentordetails";
import Booking from "./Booking";

export default function LearnerDashboard() {
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [mentors, setMentors] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [formData, setFormData] = useState({
        mentor: '',
        date: '',
        slot: ''
    });
    const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
    const [showReviewComponent, setShowReviewComponent] = useState(false);
     const { token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
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

        newSocket.on('booking:statusUpdate', (data) => {
            console.log('Booking status update:', data);
            fetchBookings();
            
            if (data.status === 'confirmed') {
                setMessage(`Your booking with ${data.mentor.username} has been confirmed!`);
                setMessageType('success');
            } else if (data.status === 'rejected') {
                setMessage(`Your booking with ${data.mentor.username} has been rejected.`);
                setMessageType('error');
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [token]);

    useEffect(() => {
        fetchBookings();
        fetchMentors();
    }, []);

    const fetchMentors = async () => {
        try {
            const response = await axios.get(
                `${ApiUrl}/auth/mentors`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setMentors(response.data.mentors || []);
        } catch (err) {
            console.error('Error fetching mentors:', err);
            setError('Failed to load mentors');
        }
    };

    const fetchBookings = async () => {
        try {
            const response = await axios.get(
                `${ApiUrl}/booking`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    params: {
                        role: 'learner'
                    }
                }
            );
            
            if (response.status === 200) {
                setBookings(response.data.bookings || []);
            }
        } catch (err) {
            console.error("Error fetching bookings:", err);
            setError('Failed to load bookings');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'mentor') {
            setFormData(prev => ({
                ...prev,
                slot: ''
            }));
            fetchAvailableSlots(value);
        }
    };

    const fetchAvailableSlots = async (mentorId) => {
        if (!mentorId) {
            setAvailableSlots([]);
            return;
        }

        try {
            const defaultSlots = [
                '09:00 AM - 10:00 AM',
                '10:00 AM - 11:00 AM',
                '11:00 AM - 12:00 PM',
                '02:00 PM - 03:00 PM',
                '03:00 PM - 04:00 PM',
                '04:00 PM - 05:00 PM'
            ];
            setAvailableSlots(defaultSlots);
        } catch (err) {
            console.error('Error fetching slots:', err);
            setError('Failed to load available slots');
            setAvailableSlots([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.mentor || !formData.date || !formData.slot) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const response = await axios.post(
                `${ApiUrl}/booking/create`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.status === 201) {
                setFormData({
                    mentor: '',
                    date: '',
                    slot: ''
                });
                setAvailableSlots([]);
                await fetchBookings();
                setMessage('Booking created successfully!');
                setMessageType('success');
            }
        } catch (err) {
            console.error("Error creating booking:", err);
            setError(err.response?.data?.message || 'Failed to create booking');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        try {
            setLoading(true);
            setError('');

            const response = await axios.put(
                `${ApiUrl}/booking/${bookingId}/status`,
                { status: 'cancelled' },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.status === 200) {
                await fetchBookings();
                setMessage('Booking cancelled successfully');
                setMessageType('success');
            }
        } catch (err) {
            console.error('Error cancelling booking:', err);
            setError(err.response?.data?.message || 'Failed to cancel booking');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async (bookingId) => {
        try {
            setLoading(true);
            setError('');
            
            // Find the booking to get the room ID
            const booking = bookings.find(b => b._id === bookingId || b.id === bookingId);
            if (!booking || !booking.roomId) {
                setError('Room not found for this booking');
                return;
            }
            
            // Navigate to the room using the room ID
            navigate(`/room/${booking.roomId}`);
        } catch (err) {
            console.error('Error joining room:', err);
            setError('Failed to join room');
        } finally {
            setLoading(false);
        }
    };

    const handleReviewClick = (booking) => {
        console.log("Selected booking for review:", booking);
        console.log("Available mentors:", mentors);
        setSelectedBookingForReview(booking);
        setShowReviewComponent(true);
    };

    const handleReviewSubmitted = () => {
        setShowReviewComponent(false);
        setSelectedBookingForReview(null);
        fetchBookings(); // Refresh bookings to update review status
    };

    const handleBackToDashboard = () => {
        setShowReviewComponent(false);
        setSelectedBookingForReview(null);
    };
    const isBookingCompleted = (booking) => {
        const bookingDate = new Date(booking.date);
        const today = new Date();
        return booking.status === 'confirmed' && bookingDate < today;
    };

    if (showReviewComponent && selectedBookingForReview) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="max-w-7xl mx-auto p-6">
                    <div className="mb-6">
                        <button
                            onClick={handleBackToDashboard}
                            className="flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Dashboard
                        </button>
                    </div>
                    <Review 
                        bookingId={selectedBookingForReview.id || selectedBookingForReview._id}
                        mentor={
                            typeof selectedBookingForReview.mentor === 'object'
                                ? selectedBookingForReview.mentor
                                : mentors.find(m => m.id === selectedBookingForReview.mentor || m._id === selectedBookingForReview.mentor)
                        }
                        onReviewSubmitted={handleReviewSubmitted}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">Learner Dashboard</h1>
                            <p className="text-gray-600">Manage your mentorship sessions and bookings</p>
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
                                <div className="text-2xl font-bold text-blue-600">{bookings.length}</div>
                                <div className="text-sm text-gray-500">Total Sessions</div>
                            </div>
                        </div>
                    </div>
                </div>

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
                        messageType === 'success' 
                            ? 'bg-green-50 border border-green-200 text-green-600'
                            : 'bg-red-50 border border-red-200 text-red-600'
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

                {/* Mentor Cards Section */}
                <div className="mb-10">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                            <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Available Mentors
                        </h2>
                        <AllMentorsDetails />
                    </div>
                </div>

                {/* Sessions Section */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Your Sessions
                    </h2>
                    
                    {bookings.length > 0 ? (
                        <div className="grid gap-6">
                            {bookings.map((booking) => (
                                <div key={booking._id || booking.id} className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100 hover:shadow-lg transition-all duration-200">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center mb-3">
                                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                                                    {booking.mentor?.username?.charAt(0)?.toUpperCase() || 'M'}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        Session with {booking.mentor?.username || 'Unknown Mentor'}
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
                                                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col space-y-2">
                                            {booking.status === 'confirmed' && !isBookingCompleted(booking) && (
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
                                            {booking.status === 'pending' && (
                                                <button
                                                    onClick={() => handleCancelBooking(booking._id || booking.id)}
                                                    className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
                                                >
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Cancel
                                                </button>
                                            )}
                                            {isBookingCompleted(booking) && (
                                                <button
                                                    onClick={() => handleReviewClick(booking)}
                                                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md"
                                                >
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                    </svg>
                                                    Review Session
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions found</h3>
                            <p className="mt-1 text-sm text-gray-500">Get started by booking a session with a mentor.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}