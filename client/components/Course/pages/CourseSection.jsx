import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ApiUrl } from '../../../configs';
import FilesView from './FilesView';
export default function CourseSection({ courseId }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${ApiUrl}/sections/${courseId}`);
        setSections(res.data.section || []);
      } catch (err) {
        setError('Failed to fetch sections');
      } finally {
        setLoading(false);
      }
    };
    if (courseId) {
      fetchSections();
    }
  }, [courseId]);

  if (loading) return <div>Loading sections...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Course Sections</h2>
      {sections.length === 0 ? (
        <div>No sections found for this course.</div>
      ) : (
        sections.map((section, idx) => (
          <div 
            key={section._id || idx} 
            style={{ 
              border: '1px solid #ccc', 
              margin: '20px 0', 
              padding: '20px',
              borderRadius: '8px'
            }}
          >
            <h3>{section.title}</h3>
            
            <FilesView 
              courseId={courseId} 
              sectionId={section._id} 
            />
          </div>
        ))
      )}
    </div>
  );
}