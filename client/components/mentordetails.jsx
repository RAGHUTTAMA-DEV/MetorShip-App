import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { ApiUrl } from "../configs";

const STATIC_SLOTS = [
  "09:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "02:00 PM - 03:00 PM",
  "03:00 PM - 04:00 PM",
  "04:00 PM - 05:00 PM"
];

export default function AllMentorsDetails() {
    const [mentors, setMentors] = useState([]);
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [bookingMentorId, setBookingMentorId] = useState(null);
    const [formData, setFormData] = useState({ date: '', slot: '' });
    const [availableSlots, setAvailableSlots] = useState([]);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState("");
    const [bookingSuccess, setBookingSuccess] = useState("");

    useEffect(() => {
        fetchMentorDetails();
    }, []);

    const fetchMentorDetails = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await axios.get(`${ApiUrl}/auth/mentors`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            setMentors(response.data.mentors || []);
        } catch (err) {
            setError("Failed to load mentors");
        } finally {
            setLoading(false);
        }
    };

    const handleBookMentorClick = async (mentor) => {
        setBookingMentorId(mentor.id || mentor._id);
        setFormData({ date: '', slot: '' });
        setBookingError("");
        setBookingSuccess("");
        setAvailableSlots(STATIC_SLOTS);
    };

    const handleBookingInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBookingSubmit = async (e, mentor) => {
        e.preventDefault();
        setBookingLoading(true);
        setBookingError("");
        setBookingSuccess("");
        try {
            await axios.post(`${ApiUrl}/booking/create`, {
                mentor: mentor.id || mentor._id,
                date: formData.date,
                slot: formData.slot
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookingSuccess("Booking created successfully!");
            setFormData({ date: '', slot: '' });
            setBookingMentorId(null);
        } catch (err) {
            setBookingError(err.response?.data?.message || 'Failed to create booking');
        } finally {
            setBookingLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">All Mentor Details</h2>
            {loading && <div>Loading mentors...</div>}
            {error && <div className="text-red-600">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(mentors) && mentors.length > 0 && mentors.map((mentor) => (
                    <div key={mentor.id || mentor._id} className="bg-white rounded-lg shadow p-6 flex flex-col items-start mb-4">
                        <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold mb-2">
                            {mentor.username?.charAt(0)?.toUpperCase() || mentor.name?.charAt(0)?.toUpperCase() || 'M'}
                        </div>
                        <div className="mb-2 font-semibold text-lg">{mentor.username || mentor.name}</div>
                        <div className="mb-1 text-gray-700">Email: {mentor.email}</div>
                        <div className="mb-1 text-gray-700">Expertise: {mentor.expertise || 'N/A'}</div>
                        <div className="mb-1 text-gray-700">Availability: {
                            Array.isArray(mentor.availability)
                                ? mentor.availability.map((a, idx) => (
                                    <div key={idx}>
                                        {a.day}: {Array.isArray(a.slots) ? a.slots.join(', ') : ''}
                                    </div>
                                ))
                                : typeof mentor.availability === 'object' && mentor.availability !== null
                                    ? JSON.stringify(mentor.availability)
                                    : mentor.availability || 'N/A'
                        }</div>
                        <button
                            className="mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                            onClick={() => handleBookMentorClick(mentor)}
                        >
                            Book Mentor
                        </button>
                        {/* Inline Booking Form */}
                        {bookingMentorId === (mentor.id || mentor._id) && (
                            <form onSubmit={e => handleBookingSubmit(e, mentor)} className="w-full mt-4 bg-gray-50 p-4 rounded shadow-inner">
                                <div className="mb-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mentor</label>
                                    <input
                                        type="text"
                                        value={mentor.username || mentor.name}
                                        disabled
                                        className="w-full px-3 py-2 border rounded-md bg-gray-100"
                                    />
                                </div>
                                <div className="mb-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleBookingInputChange}
                                        required
                                        className="w-full px-3 py-2 border rounded-md"
                                    />
                                </div>
                                <div className="mb-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
                                    <select
                                        name="slot"
                                        value={formData.slot}
                                        onChange={handleBookingInputChange}
                                        required
                                        className="w-full px-3 py-2 border rounded-md"
                                    >
                                        <option value="">Select a time slot</option>
                                        {STATIC_SLOTS.map(slot => (
                                            <option key={slot} value={slot}>{slot}</option>
                                        ))}
                                    </select>
                                </div>
                                {bookingError && <div className="text-red-600 mb-2">{bookingError}</div>}
                                {bookingSuccess && <div className="text-green-600 mb-2">{bookingSuccess}</div>}
                                <div className="flex gap-2 mt-2">
                                    <button
                                        type="submit"
                                        disabled={bookingLoading || !formData.date || !formData.slot}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        {bookingLoading ? 'Booking...' : 'Book'}
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                        onClick={() => setBookingMentorId(null)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}