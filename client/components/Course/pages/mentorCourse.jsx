import { useEffect, useState } from "react";
import axios from "axios";
import { ApiUrl } from "../../../configs";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import FileUpload from "./FileUpload";
import FilesView from "./FilesView";

export default function MentorCourseDash() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState([]);
  const [thumbnail, setThumbnail] = useState('');
  const [error, setError] = useState('');
  const [courses, setCourses] = useState([]);
  const [mycourses, SetmyCourses] = useState([]);
  const [sections, setSections] = useState([]);
  
  // Section creation states
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionOrder, setSectionOrder] = useState('');
  const [showSectionForm, setShowSectionForm] = useState(false);
  
  const { user, token } = useAuth();

  const CreateCall = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${ApiUrl}/courses/`, {
        title,
        description,
        price,
        isActive,
        category,
        tags,
        thumbnail,
        instructor: user.id,
      });

      if (res.status === 200 || res.status === 201) {
        setError('');
        toast.success('Course Created Successfully');
        setTitle('');
        setDescription('');
        setPrice('');
        setIsActive(false);
        setCategory('');
        setTags([]);
        setThumbnail('');
        GetALLCourses();
        GetMyCourses();
      } else {
        setError('Error: ' + (res.data.message || 'Unknown error'));
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const CreateSection = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !sectionTitle || !sectionOrder) {
      toast.error('Please fill all section fields');
      return;
    }

    try {
      const res = await axios.post(`${ApiUrl}/sections`, {
        courseId: selectedCourseId,
        title: sectionTitle,
        order: parseInt(sectionOrder)
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.status === 200 || res.status === 201) {
        toast.success('Section Created Successfully');
        setSectionTitle('');
        setSectionOrder('');
        setSelectedCourseId('');
        setShowSectionForm(false);
        GetMyCourses(); // Refresh to get updated sections
      }
    } catch (error) {
      toast.error('Error creating section: ' + error.message);
    }
  };

  const GetALLCourses = async () => {
    try {
      const response = await axios.get(`${ApiUrl}/courses/`);
      setCourses(response.data.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  const GetMyCourses = async () => {
    try {
      const res = await axios.get(`${ApiUrl}/courses/my-courses`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (res.data.success && res.data.data) {
        const coursesArray = Object.values(res.data.data).filter(item => 
          item && typeof item === 'object' && item._id && item.title
        );
        SetmyCourses(coursesArray);
        
        if (res.data.data.sections) {
          setSections(res.data.data.sections);
        }
        
        toast.success('Courses Fetched Successfully');
      }
    } catch (err) {
      console.log(err);
      setError(err.message);
      toast.error('Error Fetching Courses');
    }
  };

  const getSectionsForCourse = (courseId) => {
    return sections.filter(section => section.courseId === courseId);
  };

  useEffect(() => {
    GetALLCourses();
    GetMyCourses();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900">Mentor Course Dashboard</h2>
          <p className="text-gray-600 mt-1">Manage your courses and sections</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error: {error}</p>
        </div>
      )}

      {/* Create Course Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Create New Course</h3>
        </div>
        
        <div className="p-6">
          <form onSubmit={CreateCall} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Enter course title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input 
                  type="text" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  placeholder="Course category"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Course description"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                <input 
                  type="number" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                  placeholder="Course price"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                <input 
                  type="url" 
                  value={thumbnail} 
                  onChange={(e) => setThumbnail(e.target.value)} 
                  placeholder="Thumbnail image URL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input 
                type="text" 
                value={tags.join(',')} 
                onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()))} 
                placeholder="Tags (comma-separated)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="isActive"
                checked={isActive} 
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Make course active
              </label>
            </div>

            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
            >
              Create Course
            </button>
          </form>
        </div>
      </div>

      {/* Section Creation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">Course Sections</h3>
          <button
            onClick={() => setShowSectionForm(!showSectionForm)}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {showSectionForm ? 'Cancel' : 'Add Section'}
          </button>
        </div>
        
        {showSectionForm && (
          <div className="p-6 bg-gray-50">
            <form onSubmit={CreateSection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">Choose a course...</option>
                  {mycourses.map(course => (
                    <option key={course._id} value={course._id}>{course.title}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                  <input
                    type="text"
                    value={sectionTitle}
                    onChange={(e) => setSectionTitle(e.target.value)}
                    placeholder="Section title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <input
                    type="number"
                    value={sectionOrder}
                    onChange={(e) => setSectionOrder(e.target.value)}
                    placeholder="Section order (1, 2, 3...)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
              >
                Create Section
              </button>
            </form>
          </div>
        )}
      </div>

      {/* All Courses Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">All Courses</h3>
        </div>
        
        <div className="p-6">
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {courses.map((course, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start space-x-4">
                    <img 
                      src={course.thumbnail} 
                      alt="thumbnail" 
                      className="w-24 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 space-y-2">
                      <h4 className="text-lg font-semibold text-gray-900">{course.title}</h4>
                      <p className="text-sm text-gray-600">₹{course.price} • {course.category}</p>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          course.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {course.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Tags: {Array.isArray(course.tags) ? course.tags.join(", ") : course.tags}
                      </p>
                    </div>
                  </div>
                  
                  {Array.isArray(course.sections) && course.sections.length > 0 && (
                    <div className="mt-4">
                      <FileUpload courseId={course._id || course.id} sectionId={course.sections[0]._id || course.sections[0].id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No courses found.</p>
            </div>
          )}
        </div>
      </div>

      {/* My Courses Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">My Courses</h3>
        </div>
        
        <div className="p-6">
          {mycourses.length > 0 ? (
            <div className="space-y-8">
              {mycourses.map((course) => {
                const courseSections = getSectionsForCourse(course._id);
                return (
                  <div key={course._id} className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                    <div className="flex items-start space-x-6 mb-6">
                      <img 
                        src={course.thumbnail} 
                        alt="thumbnail" 
                        className="w-32 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1 space-y-3">
                        <h4 className="text-2xl font-bold text-gray-900">{course.title}</h4>
                        <p className="text-gray-600">{course.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Price:</span>
                            <p className="text-blue-600 font-semibold">₹{course.price}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Category:</span>
                            <p className="text-gray-900">{course.category}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Enrollments:</span>
                            <p className="text-gray-900">{course.totalEnrollments}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Rating:</span>
                            <p className="text-yellow-600 font-semibold">{course.averageRating}/5</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            course.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {course.isActive ? "Active" : "Inactive"}
                          </span>
                          <span className="text-sm text-gray-600">
                            Tags: {Array.isArray(course.tags) ? course.tags.join(", ") : "No tags"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sections */}
                    <div className="border-t border-blue-200 pt-6">
                      <h5 className="text-lg font-semibold text-gray-900 mb-4">Course Sections</h5>
                      {courseSections && courseSections.length > 0 ? (
                        <div className="space-y-6">
                          {courseSections.map((section) => (
                            <div key={section._id} className="bg-white rounded-lg border border-gray-200 p-4">
                              <div className="flex items-center justify-between mb-4">
                                <h6 className="text-lg font-medium text-gray-900">
                                  📌 {section.title}
                                </h6>
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                  Order: {section.order}
                                </span>
                              </div>
                              
                              <div className="space-y-4">
                                <FileUpload courseId={course._id} sectionId={section._id} />
                                <FilesView courseId={course._id} sectionId={section._id} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                          <p className="text-gray-500">No sections available for this course.</p>
                          <p className="text-sm text-gray-400 mt-1">Create sections to organize your course content.</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No courses found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}