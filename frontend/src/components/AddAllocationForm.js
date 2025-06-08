import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import * as XLSX from 'xlsx';

function AddAllocationForm() {
  const [formData, setFormData] = useState({
    school_id: '',
    course_id: '',
    grade1_students: '',
    grade2_students: '',
    grade3_students: ''
  });

  const [schools, setSchools] = useState([]);
  const [courses, setCourses] = useState([]);
  const [message, setMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:8000/api/schools/')
      .then(res => setSchools(res.data))
      .catch(err => console.error("Error fetching schools", err));

    axios.get('http://localhost:8000/api/courses/')
      .then(res => setCourses(res.data))
      .catch(err => console.error("Error fetching courses", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (selectedOption, actionMeta) => {
    const name = actionMeta.name;
    const value = selectedOption ? selectedOption.value : '';
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrorDetails(null);

    try {
      await axios.post('http://localhost:8000/api/allocation/', formData);
      setMessage('✅ Allocation saved successfully!');
      setFormData({
        school_id: '',
        course_id: '',
        grade1_students: '',
        grade2_students: '',
        grade3_students: ''
      });
    } catch (err) {
      const errors = err.response?.data;
      console.error(errors);
      setMessage('❌ Failed to save allocation.');
      setErrorDetails(errors);
    }
  };

  // ✅ Excel Upload Handler with name-to-ID mapping
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const payload = jsonData.map(row => {
        const school = schools.find(s => s.name.trim().toLowerCase() === row.school_name?.trim().toLowerCase());
        const course = courses.find(c => c.name.trim().toLowerCase() === row.course_name?.trim().toLowerCase());

        return {
          school_id: school?.id || null,
          course_id: course?.id || null,
          grade1_students: row.grade1_students || 0,
          grade2_students: row.grade2_students || 0,
          grade3_students: row.grade3_students || 0
        };
      });

      const validData = payload.filter(p => p.school_id && p.course_id);

      if (validData.length === 0) {
        setMessage("❌ No valid records found. Check school or course names.");
        return;
      }

      try {
        await axios.post('http://localhost:8000/api/bulk-upload/', validData);
        setMessage('✅ Excel data uploaded successfully!');
      } catch (err) {
        setMessage('❌ Excel upload failed.');
        setErrorDetails(err.response?.data);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const schoolOptions = schools.map(school => ({ value: school.id, label: school.name }));
  const courseOptions = courses.map(course => ({ value: course.id, label: course.name }));

  return (
    <div style={{ padding: '1rem', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Add Allocation</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>School:</label>
          <Select
            name="school_id"
            value={schoolOptions.find(option => option.value === formData.school_id)}
            onChange={handleSelectChange}
            options={schoolOptions}
            placeholder="Select or type school..."
            isClearable
          />
        </div>

        <div style={{ marginBottom: '0.5rem' }}>
          <label>Course:</label>
          <Select
            name="course_id"
            value={courseOptions.find(option => option.value === formData.course_id)}
            onChange={handleSelectChange}
            options={courseOptions}
            placeholder="Select or type course..."
            isClearable
          />
        </div>

        <InputField label="Grade 1 Students" name="grade1_students" value={formData.grade1_students} onChange={handleChange} />
        <InputField label="Grade 2 Students" name="grade2_students" value={formData.grade2_students} onChange={handleChange} />
        <InputField label="Grade 3 Students" name="grade3_students" value={formData.grade3_students} onChange={handleChange} />

        <button type="submit">Submit Allocation</button>
      </form>

      {/* ✅ Excel Upload UI */}
      <div style={{ marginTop: '1rem' }}>
        <label>Upload Excel File:</label>
        <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} />
      </div>

      {message && <p style={{ marginTop: '1rem' }}>{message}</p>}

      {errorDetails && (
        <div style={{ marginTop: '0.5rem', color: 'red' }}>
          <strong>Validation Errors:</strong>
          <ul>
            {Object.entries(errorDetails).map(([field, messages], idx) => (
              <li key={idx}>
                <strong>{field}:</strong> {Array.isArray(messages) ? messages.join(', ') : messages}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function InputField({ label, name, value, onChange }) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <label>
        {label}:
        <input
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          style={{ marginLeft: '0.5rem', width: '100%' }}
          required
        />
      </label>
    </div>
  );
}

export default AddAllocationForm;
