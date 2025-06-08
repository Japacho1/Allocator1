import React, { useState } from 'react';
import axios from 'axios';
import "./AddCourse.css";

function AddCourse() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/courses/', { name });
      if (response.status === 201) {
        setMessage('Course added successfully!');
        setName('');
      }
    } catch (error) {
      setMessage('Failed to add course.');
    }
  };

  return (
    <div className="form-container">
     
      <h2>Add a New Course</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <label>Course Name:</label><br />
        <div>
        <input
          type="text"
          value={name}
          name='name'
          onChange={(e) => setName(e.target.value)}
          required
        />
        <br />
        </div>
        <button type="submit">Add Course</button>
      </form>
    </div>
  );
}

export default AddCourse;
