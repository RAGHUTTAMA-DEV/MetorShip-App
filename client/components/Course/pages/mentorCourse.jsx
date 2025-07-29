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
  const [sections, setSections] = useState([]); // Add sections state
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
      
      // Handle the nested response structure
      if (res.data.success && res.data.data) {
        // Extract courses - they're in numbered keys (0, 1, 2, etc.)
        const coursesArray = Object.values(res.data.data).filter(item => 
          item && typeof item === 'object' && item._id && item.title
        );
        SetmyCourses(coursesArray);
        
        // Extract sections if they exist
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

  // Helper function to get sections for a specific course
  const getSectionsForCourse = (courseId) => {
    return sections.filter(section => section.courseId === courseId);
  };

  useEffect(() => {
    GetALLCourses();
    GetMyCourses();
  }, []);

  return (
    <div>
      <h2>Mentor Course Dashboard</h2>

      <div>
        <h3>Create Course</h3>
        <form onSubmit={CreateCall}>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course Title" />
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" />
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />
          <input type="text" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} placeholder="Thumbnail URL" />
          <input type="text" value={tags.join(',')} onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()))} placeholder="Tags (comma-separated)" />
          <label>
            Active:
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          </label>
          <button type="submit">Create Course</button>
        </form>

        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>

      <div>
        <h3>All Courses</h3>
        {courses.length > 0 ? (
          courses.map((course, idx) => (
            <ul key={idx} style={{ border: "1px solid gray", padding: "10px", marginBottom: "10px" }}>
              <li><strong>Title:</strong> {course.title}</li>
              <li><strong>Price:</strong> ₹{course.price}</li>
              <li><strong>Category:</strong> {course.category}</li>
              <li><img src={course.thumbnail} alt="thumbnail" style={{ width: "120px", height: "auto" }} /></li>
              <li><strong>Status:</strong> {course.isActive ? "Active" : "Inactive"}</li>
              <li><strong>Tags:</strong> {Array.isArray(course.tags) ? course.tags.join(", ") : course.tags}</li>
              <li><strong>Sections:</strong> {Array.isArray(course.sections) ? course.sections.map(s => s.title).join(", ") : "No Sections"}</li>
              <li>
                {Array.isArray(course.sections) && course.sections.length > 0 && (
                  <FileUpload courseId={course._id || course.id} sectionId={course.sections[0]._id || course.sections[0].id} />
                )}
              </li>
            </ul>
          ))
        ) : (
          <p>No courses found.</p>
        )}
      </div>

      <div>
        <h3>My Courses</h3>
        {mycourses.length > 0 ? (
          mycourses.map((course, idx) => {
            const courseSections = getSectionsForCourse(course._id);
            return (
              <div key={course._id} style={{ border: "1px solid gray", padding: "10px", marginBottom: "10px" }}>
                <h4>{course.title}</h4>
                <img src={course.thumbnail} alt="thumbnail" width={150} />
                <p><strong>Description:</strong> {course.description}</p>
                <p><strong>Category:</strong> {course.category}</p>
                <p><strong>Price:</strong> ₹{course.price}</p>
                <p><strong>Tags:</strong> {Array.isArray(course.tags) ? course.tags.join(", ") : "No tags"}</p>
                <p><strong>Status:</strong> {course.isActive ? "Active" : "Inactive"}</p>
                <p><strong>Total Enrollments:</strong> {course.totalEnrollments}</p>
                <p><strong>Average Rating:</strong> {course.averageRating}/5</p>

                <h5>Sections:</h5>
                {courseSections && courseSections.length > 0 ? (
                  courseSections.map((section) => (
                    <div key={section._id} style={{ marginLeft: "20px", marginBottom: "10px" }}>
                      <p>📌 <strong>{section.title}</strong> (Order: {section.order})</p>
                      <FileUpload courseId={course._id} sectionId={section._id} />
                      <FilesView courseId={course._id} sectionId={section._id} />
                    </div>
                  ))
                ) : (
                  <p>No sections available for this course.</p>
                )}
              </div>
            );
          })
        ) : (
          <p>No courses found.</p>
        )}
      </div>
    </div>
  );
}