import axios from "axios";
import { useEffect, useState } from "react";
import { ApiUrl } from "../../../configs";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import CourseSection from "./CourseSection";

export default function UserCourseDash() {
  const [err, setErr] = useState('');
  const [courses, setCourses] = useState([]);
  const [myPurchases, setMyPurchases] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    GetALLCourses();
    GetMyPurchases();
  }, []);

  const GetALLCourses = async () => {
    try {
      const res = await axios.get(`${ApiUrl}/courses`);
      setCourses(res.data.data || []);
      toast.success("Courses fetched successfully");
    } catch (err) {
      console.log(err);
      setErr(err.message);
    }
  };

  const GetMyPurchases = async () => {
    try {
      const res = await axios.get(`${ApiUrl}/purchase/my-purchases`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMyPurchases(res.data.data || []);
      toast.success("My purchases fetched successfully");
    } catch (err) {
      console.log(err);
      setErr(err.message);
    }
  };

  const PurchaseCourse = async (courseId) => {
    try {
      const res = await axios.post(
        `${ApiUrl}/purchase`,
        { courseId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success(res.data.message);
      GetMyPurchases();
    } catch (err) {
      console.log(err);
      setErr(err.message);
      toast.error("Error purchasing course");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Error Display */}
      {err && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error: {err}</p>
        </div>
      )}

      {/* All Courses Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">All Courses Available</h2>
          <p className="text-gray-600 mt-1">Browse and purchase courses</p>
        </div>
        
        <div className="p-6">
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
                <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {course.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {course.description}
                      </p>
                    </div>
                    
                    <div className="pt-2">
                      <button
                        onClick={() => PurchaseCourse(course._id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Purchase Course
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-3">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No courses available</h3>
              <p className="text-gray-500">Check back later for new courses.</p>
            </div>
          )}
        </div>
      </div>

      {/* My Purchased Courses Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">My Purchased Courses</h2>
          <p className="text-gray-600 mt-1">Your enrolled courses</p>
        </div>
        
        <div className="p-6">
          {myPurchases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myPurchases.map((course, index) => (
                <div key={index} className="bg-green-50 rounded-lg border border-green-200 p-6 hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {course.title}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Purchased
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {course.description}
                    </p>
                    
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-700">Price:</span>
                        <span className="text-green-600 font-semibold">${course.price}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-700">Instructor:</span>
                        <span className="text-gray-900">{course.instructor}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-700">Category:</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                          {course.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-3">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M8 11v6a2 2 0 002 2h4a2 2 0 002-2v-6M8 11h8" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No purchased courses yet</h3>
              <p className="text-gray-500">Purchase a course above to get started with your learning journey.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}