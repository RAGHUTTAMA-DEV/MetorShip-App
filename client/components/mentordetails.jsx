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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-600">Loading mentors...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
        );
    }

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(mentors) && mentors.length > 0 && mentors.map((mentor) => (
                    <div key={mentor.id || mentor._id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                        {/* Mentor Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                            <div className="flex items-center mb-4">
                                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl font-bold mr-4">
                                    {mentor.username?.charAt(0)?.toUpperCase() || mentor.name?.charAt(0)?.toUpperCase() || 'M'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{mentor.username || mentor.name}</h3>
                                    <p className="text-blue-100 text-sm">{mentor.expertise || 'General Mentor'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Mentor Details */}
                        <div className="p-6">
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                    <span className="text-gray-700">{mentor.email}</span>
                                </div>
                                
                                <div className="flex items-start">
                                    <svg className="w-4 h-4 mr-3 mt-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="text-gray-700">
                                        <div className="font-medium mb-1">Availability:</div>
                                        <div className="text-sm">
                                            {Array.isArray(mentor.availability)
                                                ? mentor.availability.map((a, idx) => (
                                                    <div key={idx} className="mb-1">
                                                        <span className="font-medium">{a.day}:</span> {Array.isArray(a.slots) ? a.slots.join(', ') : ''}
                                                    </div>
                                                ))
                                                : typeof mentor.availability === 'object' && mentor.availability !== null
                                                    ? JSON.stringify(mentor.availability)
                                                    : mentor.availability || 'Flexible schedule'
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Book Mentor Button */}
                            <button
                                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-md"
                                onClick={() => handleBookMentorClick(mentor)}
                            >
                                <div className="flex items-center justify-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Book Session
                                </div>
                            </button>

                            {/* Inline Booking Form */}
                            {bookingMentorId === (mentor.id || mentor._id) && (
                                <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Book Session with {mentor.username || mentor.name}
                                    </h4>
                                    
                                    <form onSubmit={e => handleBookingSubmit(e, mentor)} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                            <input
                                                type="date"
                                                name="date"
                                                value={formData.date}
                                                onChange={handleBookingInputChange}
                                                required
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
                                            <select
                                                name="slot"
                                                value={formData.slot}
                                                onChange={handleBookingInputChange}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
                                            >
                                                <option value="">Select a time slot</option>
                                                {STATIC_SLOTS.map(slot => (
                                                    <option key={slot} value={slot}>{slot}</option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        {bookingError && (
                                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <div className="flex">
                                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                    <p className="ml-2 text-sm text-red-600">{bookingError}</p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {bookingSuccess && (
                                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                                <div className="flex">
                                                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    <p className="ml-2 text-sm text-green-600">{bookingSuccess}</p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="flex gap-3">
                                            <button
                                                type="submit"
                                                disabled={bookingLoading || !formData.date || !formData.slot}
                                                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                            >
                                                {bookingLoading ? (
                                                    <div className="flex items-center justify-center">
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Booking...
                                                    </div>
                                                ) : (
                                                    'Confirm Booking'
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                                                onClick={() => setBookingMentorId(null)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            
            {Array.isArray(mentors) && mentors.length === 0 && (
                <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No mentors available</h3>
                    <p className="mt-1 text-sm text-gray-500">Check back later for available mentors.</p>
                </div>
            )}
        </div>
    );
}