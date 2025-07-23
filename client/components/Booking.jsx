import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ApiUrl } from '../configs';

export default function Booking() {
    const { token, user } = useAuth();
    const [formData, setFormData] = useState({
        mentor: '',
        date: '',
        slot: '',
        sessionLink: '',
        whiteBoardId: '',
        chatRoomId: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [mentors, setMentors] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);

    useEffect(() => {
        fetchMentors();
    }, []);

    const fetchMentors = async () => {
        try {
            const response = await axios.get(`${ApiUrl}/auth/mentors`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setMentors(response.data.mentors);
        } catch (err) {
            console.error('Error fetching mentors:', err);
            setError('Failed to load mentors');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // If mentor is selected, fetch their available slots
        if (name === 'mentor') {
            fetchAvailableSlots(value);
        }
    };

    const fetchAvailableSlots = async (mentorId) => {
        try {
            const response = await axios.get(`${ApiUrl}/auth/mentor/${mentorId}/slots`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setAvailableSlots(response.data.slots);
        } catch (err) {
            console.error('Error fetching slots:', err);
            setError('Failed to load available slots');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.post(
                    `${ApiUrl}/booking/create`,
                {
                    ...formData,
                    userId: user.id
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setSuccess('Booking created successfully!');
            setFormData({
                mentor: '',
                date: '',
                slot: '',
                sessionLink: '',
                whiteBoardId: '',
                chatRoomId: ''
            });
        } catch (err) {
            console.error('Booking error:', err);
            setError(err.response?.data?.message || 'Failed to create booking');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Book a Session</h1>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-600">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Session Details</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Mentor
                            </label>
                            <select
                                name="mentor"
                                value={formData.mentor}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Choose a mentor</option>
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select a time slot</option>
                                {availableSlots.map(slot => (
                                    <option key={slot} value={slot}>
                                        {slot}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Session Link
                            </label>
                            <input
                                type="url"
                                name="sessionLink"
                                value={formData.sessionLink}
                                onChange={handleInputChange}
                                placeholder="https://meet.google.com/..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Whiteboard ID
                            </label>
                            <input
                                type="text"
                                name="whiteBoardId"
                                value={formData.whiteBoardId}
                                onChange={handleInputChange}
                                placeholder="Enter whiteboard ID"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Chat Room ID
                            </label>
                            <input
                                type="text"
                                name="chatRoomId"
                                value={formData.chatRoomId}
                                onChange={handleInputChange}
                                placeholder="Enter chat room ID"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating Booking...' : 'Create Booking'}
                    </button>
                </div>
            </form>
        </div>
    );
} 