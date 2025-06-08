import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SchoolCoursesList.css';

function SchoolCoursesList() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('http://localhost:8000/api/schools/')
      .then(res => {
        setSchools(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to fetch schools.');
        setLoading(false);
      });
  }, []);

  const deleteSchool = async (schoolId) => {
    try {
      await axios.delete(`http://localhost:8000/api/schools/${schoolId}/delete/`);
      setSchools(prevSchools => prevSchools.filter(school => school.id !== schoolId));
    } catch (error) {
      console.error('Failed to delete school:', error);
      alert('Failed to delete school.');
    }
  };

  return (
    <div className="school-courses-container">
      <h2>Schools and Their Courses</h2>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <table className="schools-table">
          <thead>
            <tr>
              <th>School Name</th>
              <th>Location</th>
              <th>Courses Offered</th>
              <th>Actions</th> {/* New column */}
            </tr>
          </thead>
          <tbody>
            {schools.map(school => (
              <tr key={school.id}>
                <td>{school.name}</td>
                <td>{school.location?.name || 'N/A'}</td>
                <td>
                  {school.courses_provided && school.courses_provided.length > 0 ? (
                    <ul>
                      {school.courses_provided.map(course => (
                        <li key={course.id}>{course.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <em>No courses provided</em>
                  )}
                </td>
                <td>
                  <button onClick={() => deleteSchool(school.id)} className="delete-button">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default SchoolCoursesList;
