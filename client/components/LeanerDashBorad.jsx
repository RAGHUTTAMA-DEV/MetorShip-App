import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

export default function LearnerDashboard() {
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [mentors, setMentors] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [formData, setFormData] = useState({
        mentor: '',
        date: '',
        slot: ''
    });
    const { token, user } = useAuth();

    useEffect(() => {
        fetchBookings();
        fetchMentors();
    }, []);

    const fetchMentors = async () => {
        try {
            const response = await axios.get(
                'https://metorship-app.onrender.com/api/auth/mentors',
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
                "https://metorship-app.onrender.com/api/booking",
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
            // Reset slot when mentor changes
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
            // For now, let's use a default set of slots since the endpoint is not available
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
                "https://metorship-app.onrender.com/api/booking/create",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.status === 201) {
                // Reset form
                setFormData({
                    mentor: '',
                    date: '',
                    slot: ''
                });
                setAvailableSlots([]);
                // Refresh bookings
                await fetchBookings();
            }
        } catch (err) {
            console.error("Error creating booking:", err);
            setError(err.response?.data?.message || 'Failed to create booking');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Learner Dashboard</h1>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                    {error}
                </div>
            )}

            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Book a Session</h2>
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
                    <div className="grid gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Mentor
                            </label>
                            <select
                                name="mentor"
                                value={formData.mentor}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select a mentor</option>
                                {mentors.map(mentor => (
                                    <option key={mentor._id} value={mentor._id}>
                                        {mentor.username}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                required
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Time Slot
                            </label>
                            <select
                                name="slot"
                                value={formData.slot}
                                onChange={handleInputChange}
                                required
                                disabled={!formData.mentor}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            >
                                <option value="">Select a time slot</option>
                                {availableSlots.map(slot => (
                                    <option key={slot} value={slot}>
                                        {slot}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            type="submit"
                            disabled={loading || !formData.mentor || !formData.date || !formData.slot}
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
                        >
                            {loading ? 'Creating Booking...' : 'Create Booking'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Upcoming Sessions</h2>
                {bookings.length > 0 ? (
                    <div className="grid gap-4">
                        {bookings.map((booking) => (
                            <div key={booking.id} className="p-4 bg-white rounded-lg shadow">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-medium">Session with {booking.mentor.username}</h3>
                                        <p className="text-gray-600">Date: {new Date(booking.date).toLocaleDateString()}</p>
                                        <p className="text-gray-600">Time: {booking.slot}</p>
                                        <p className="text-gray-600">Status: {booking.status}</p>
                                    </div>
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
                    <p className="text-gray-600">No upcoming sessions</p>
                )}
            </div>
        </div>
    );
}