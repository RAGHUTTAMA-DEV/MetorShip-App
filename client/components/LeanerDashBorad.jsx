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
            <div className="max-w-7xl mx-auto p-6">
                <div className="mb-6">
                    <button
                        onClick={handleBackToDashboard}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                        ← Back to Dashboard
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
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Learner Dashboard</h1>
            {/* Mentor Cards */}
            <div className="mb-10">
                <AllMentorsDetails />
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                    {error}
                </div>
            )}

            {message && (
                <div className={`mb-4 p-4 rounded-md ${
                    messageType === 'success' 
                        ? 'bg-green-50 border border-green-200 text-green-600'
                        : 'bg-red-50 border border-red-200 text-red-600'
                }`}>
                    {message}
                </div>
            )}

            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Your Sessions</h2>
                {bookings.length > 0 ? (
                    <div className="grid gap-4">
                        {bookings.map((booking) => (
                            <div key={booking._id || booking.id} className="p-4 bg-white rounded-lg shadow">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-medium">Session with {booking.mentor?.username || 'Unknown Mentor'}</h3>
                                        <p className="text-gray-600">Date: {new Date(booking.date).toLocaleDateString()}</p>
                                        <p className="text-gray-600">Time: {booking.slot}</p>
                                        <p className="text-gray-600">Status: {booking.status}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {booking.status === 'confirmed' && !isBookingCompleted(booking) && (
                                            <button
                                                onClick={() => handleJoinRoom(booking._id || booking.id)}
                                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                Join Room
                                            </button>
                                        )}
                                        {booking.status === 'pending' && (
                                            <button
                                                onClick={() => handleCancelBooking(booking._id || booking.id)}
                                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        {isBookingCompleted(booking) && (
                                            <button
                                                onClick={() => handleReviewClick(booking)}
                                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                            >
                                                Review Session
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600">No sessions found</p>
                )}
            </div>
        </div>
    );
}