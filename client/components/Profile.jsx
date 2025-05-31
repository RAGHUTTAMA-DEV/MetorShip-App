import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function Profile() {
    const { user, token } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        bio: '',
        skills: [],
        location: '',
        availability: {
            day: '',
            slots: []
        },
        experience: '',
        avatarUrl: '',
        isActive: true
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get(
                    `https://metorship-app.onrender.com/api/auth/profile/${user.id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                const userData = response.data.user;
                console.log('Fetched user data:', userData);
                setFormData({
                    bio: userData.bio || '',
                    skills: userData.skills || [],
                    location: userData.location || '',
                    availability: userData.availability || {
                        day: '',
                        slots: []
                    },
                    experience: userData.experience || '',
                    avatarUrl: userData.avatarUrl || '',
                    isActive: userData.isActive
                });
            } catch (err) {
                console.error('Profile fetch error:', err);
                setError('Failed to load profile');
            }
        };

        if (user && user.id) {
            fetchProfile();
        }
    }, [user, token]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log('Input change:', { name, value });
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: value
            };
            console.log('Updated form data:', newData);
            return newData;
        });
    };

    const handleSkillsChange = (e) => {
        const skills = e.target.value.split(',').map(skill => skill.trim());
        console.log('Skills change:', skills);
        setFormData(prev => {
            const newData = {
                ...prev,
                skills
            };
            console.log('Updated form data:', newData);
            return newData;
        });
    };

    const handleAvailabilityChange = (e) => {
        const { name, value } = e.target;
        const field = name.split('.')[1];
        console.log('Availability change:', { field, value });
        setFormData(prev => {
            const newData = {
                ...prev,
                availability: {
                    ...prev.availability,
                    [field]: value
                }
            };
            console.log('Updated form data:', newData);
            return newData;
        });
    };

    const handleSlotsChange = (e) => {
        const slots = e.target.value.split(',').map(slot => slot.trim());
        console.log('Slots change:', slots);
        setFormData(prev => {
            const newData = {
                ...prev,
                availability: {
                    ...prev.availability,
                    slots
                }
            };
            console.log('Updated form data:', newData);
            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        console.log('Submitting form data:', formData);

        try {
            const response = await axios.put(
                `https://metorship-app.onrender.com/api/auth/update/${user.id}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log('Update response:', response.data);
            setSuccess('Profile updated successfully!');
            setIsEditing(false);
        } catch (err) {
            console.error('Update error:', err.response?.data || err);
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Profile</h1>
            
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
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Basic Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input
                                type="text"
                                value={user.username}
                                readOnly
                                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={user.email}
                                readOnly
                                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <input
                                type="text"
                                value={user.role}
                                readOnly
                                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Professional Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                             
                                rows="4"
                                placeholder="Tell us about yourself..."
                                className={`w-full px-3 py-2 border rounded-md ${
                                    isEditing 
                                        ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white' 
                                        : 'bg-gray-100 border-gray-300 text-gray-600'
                                }`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma-separated)</label>
                            <input
                                type="text"
                                name="skills"
                                value={formData.skills.join(', ')}
                                onChange={handleSkillsChange}
                           
                                placeholder="e.g., JavaScript, React, Node.js"
                                className={`w-full px-3 py-2 border rounded-md ${
                                    isEditing 
                                        ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white' 
                                        : 'bg-gray-100 border-gray-300 text-gray-600'
                                }`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
    
                                placeholder="e.g., New York, USA"
                                className={`w-full px-3 py-2 border rounded-md ${
                                    isEditing 
                                        ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white' 
                                        : 'bg-gray-100 border-gray-300 text-gray-600'
                                }`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                            <textarea
                                name="experience"
                                value={formData.experience}
                                onChange={handleInputChange}
                      
                                rows="4"
                                placeholder="Describe your experience..."
                                className={`w-full px-3 py-2 border rounded-md ${
                                    isEditing 
                                        ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white' 
                                        : 'bg-gray-100 border-gray-300 text-gray-600'
                                }`}
                            />
                        </div>
                    </div>
                </div>

                {user.role === 'mentor' && (
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Availability</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                                <input
                                    type="text"
                                    name="availability.day"
                                    value={formData.availability.day}
                                    onChange={handleAvailabilityChange}
                               
                                    placeholder="e.g., Monday, Tuesday"
                                    className={`w-full px-3 py-2 border rounded-md ${
                                        isEditing 
                                            ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white' 
                                            : 'bg-gray-100 border-gray-300 text-gray-600'
                                    }`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Time Slots (comma-separated)</label>
                                <input
                                    type="text"
                                    name="availability.slots"
                                    value={formData.availability.slots.join(', ')}
                                    onChange={handleSlotsChange}
                   
                                    placeholder="e.g., 9:00-10:00, 10:00-11:00"
                                    className={`w-full px-3 py-2 border rounded-md ${
                                        isEditing 
                                            ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white' 
                                            : 'bg-gray-100 border-gray-300 text-gray-600'
                                    }`}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-4">
                    {!isEditing ? (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Edit Profile
                        </button>
                    ) : (
                        <>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            >
                                Cancel
                            </button>
                        </>
                    )}
                </div>
            </form>
        </div>
    );
}