import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ApiUrl } from '../../../configs';


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
          <div key={section._id || idx} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
            <h3>{section.title}</h3>
            {section.videoUrl && (
              <div>
                <strong>Video:</strong>
                <video width="400" controls>
                  <source src={section.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
            {section.noteUrl && (
              <div>
                <strong>Notes:</strong>
                <a href={section.noteUrl} target="_blank" rel="noopener noreferrer">Download/View Notes</a>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
