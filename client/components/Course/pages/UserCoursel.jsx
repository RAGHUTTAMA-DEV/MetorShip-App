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
    // eslint-disable-next-line
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
    <div>
      <div>
        <h3>All the course list that can be purchased</h3>
        {courses.length > 0 ? (
          courses.map((course, index) => (
            <ul key={index} style={{ border: "1px solid gray", padding: "10px", marginBottom: "10px" }}>
              <li><strong>Title:</strong> {course.title}</li>
              <li><strong>Description:</strong> {course.description}</li>
              <li>
                <button onClick={() => PurchaseCourse(course._id)}>
                  Purchase
                </button>
              </li>
            </ul>
          ))
        ) : (
          <div>No courses available.</div>
        )}
      </div>
      <div>
        <h3>My Purchased Courses</h3>
        {myPurchases.length > 0 ? (
          myPurchases.map((course, index) => (
            <ul key={index} style={{ border: "1px solid green", padding: "10px", marginBottom: "10px" }}>
              <li><strong>Title:</strong> {course.title}</li>
              <li><strong>Description:</strong> {course.description}</li>
              <li><strong>Price:</strong> {course.price}</li>
              <li><strong>Instructor:</strong> {course.instructor}</li>
              <li><strong>Category:</strong> {course.category}</li>
              <CourseSection courseId={course._id} />
            </ul>
          ))
        ) : (
          <div>No purchased courses yet.</div>
        )}
      </div>
    </div>
  );
}

