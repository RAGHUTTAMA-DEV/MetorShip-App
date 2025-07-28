import { useEffect, useState } from "react";
import axios from "axios";
import { ApiUrl } from "../../../configs";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";

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
  const [mycourses,SetmyCourses]=useState([]);
  const { user } = useAuth();

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
  //for the mentor not the learner
  const GetMyCourses = async ()=>{
     try{
        const res =await axios.get(`${ApiUrl}/courses/my-courses`);
        SetmyCourses(res.data.data || []);
        toast.success('Courses Fetched Successfully');
     }catch(err){
         console.log(err);
     setError(err.message);
     toast.error('Error Fetching Courses');

     }
  }

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
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Course Title"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
          />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
          />
          <input
            type="text"
            value={thumbnail}
            onChange={(e) => setThumbnail(e.target.value)}
            placeholder="Thumbnail URL"
          />
          <input
            type="text"
            value={tags.join(',')}
            onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()))}
            placeholder="Tags (comma-separated)"
          />
          <label>
            Active:
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
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
              <li><strong>Price:</strong> {course.price}</li>
              <li><strong>Category:</strong> {course.category}</li>
              <li><img src={course.thumbnail}/></li>
              <li><strong>Status:</strong> {course.isActive ? "Active" : "Inactive"}</li>
              <li><strong>Sections:</strong> {Array.isArray(course.sections) ? course.sections.join(", ") : course.sections}</li>
              <li><strong>Tags:</strong> {Array.isArray(course.tags) ? course.tags.join(", ") : course.tags}</li>
            </ul>
          ))
        ) : (
          <p>No courses found.</p>
        )}
      </div>

      <div>
        <h3>My Courses</h3>
        {mycourses.length>0 && mycourses.map((course, idx) =>{
            <ul key={idx} style={{ border: "1px solid gray", padding: "10px", marginBottom: "10px" }}>
              <li><strong>Title:</strong> {course.title}</li>
              <li><strong>Price:</strong> {course.price}</li>
              <li><strong>Category:</strong> {course.category}</li>
              <li><img src={course.thumbnail}/></li>
              <li><strong>Status:</strong> {course.isActive ? "Active" : "Inactive"}</li>
              <li><strong>Sections:</strong> {Array.isArray(course.sections) ? course.sections.join(", ") : course.sections}</li>


            </ul>
        })}

      </div>
    </div>
  );
}
