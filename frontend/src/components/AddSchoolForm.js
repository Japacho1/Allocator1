import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import './AddSchoolForm.css'; // Import your new CSS

function AddSchoolForm() {
  const [formData, setFormData] = useState({
    name: '',
    location_id: ''
  });

  const [constituencies, setConstituencies] = useState([]);
  const [message, setMessage] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:8000/api/constituencies/')
      .then(res => {
        const formatted = res.data.map(c => ({
          value: c.id,
          label: c.name
        }));
        setConstituencies(formatted);
      })
      .catch(err => {
        console.error('Failed to load constituencies:', err);
      });
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLocationChange = (selectedOption) => {
    setSelectedLocation(selectedOption);
    setFormData(prev => ({
      ...prev,
      location_id: selectedOption?.value || ''
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    axios.post('http://localhost:8000/api/schools/', formData)
      .then(res => {
        setMessage('✅ School added successfully!');
        setFormData({ name: '', location_id: '' });
        setSelectedLocation(null);
      })
      .catch(err => {
        console.error(err.response?.data || err.message);
        setMessage('❌ Failed to add school.');
      });
  };

  return (
    <div className="form-container">
      <h2>Add School</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>School Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Location:</label>
          <Select
            options={constituencies}
            onChange={handleLocationChange}
            value={selectedLocation}
            placeholder="Select a constituency"
            isClearable
          />
        </div>
        <button type="submit">Add School</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default AddSchoolForm;
