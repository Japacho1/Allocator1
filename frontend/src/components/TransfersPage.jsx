import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Select from 'react-select';  // Import react-select

function TransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [message, setMessage] = useState('');

  const [fromSchool, setFromSchool] = useState('');
  const [toSchool, setToSchool] = useState('');
  const [course, setCourse] = useState('');
  const [grade1, setGrade1] = useState(0);
  const [grade2, setGrade2] = useState(0);
  const [grade3, setGrade3] = useState(0);
  const [note, setNote] = useState('');

  const [schools, setSchools] = useState([]);
  const [courses, setCourses] = useState([]);

  const [showManualForm, setShowManualForm] = useState(false);

  // Create options for react-select from courses
  const courseOptions = courses.map(c => ({
    value: c.id,
    label: c.name,
  }));

  // Generic select change handler
  const handleSelectChange = (selectedOption, actionMeta) => {
    const name = actionMeta.name;
    const value = selectedOption ? selectedOption.value : '';
    if (name === 'course_id') {
      setCourse(value);
    }
  };
  const schoolOptions = schools.map(school => ({
    value: school.id,
    label: school.name,
  }));

  const fetchTransfers = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/transfers/');
      setTransfers(res.data);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    }
  };

  const handleReverse = async (id) => {
    try {
      const res = await axios.post(`http://localhost:8000/api/reverse-transfer/${id}/`);
      setMessage(res.data.message || 'Reversed successfully');
      fetchTransfers();
    } catch (err) {
      console.error(err);
      setMessage('Failed to reverse transfer');
    }
  };

  const handleManualTransfer = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        from_school_id: fromSchool,
        to_school_id: toSchool,
        course_id: course,
        grade1: parseInt(grade1),
        grade2: parseInt(grade2),
        grade3: parseInt(grade3),
        note,
      };

      await axios.post('http://localhost:8000/api/transfers/', payload);
      setMessage('Manual transfer successful!');
      fetchTransfers();

      // Clear form and close modal
      setFromSchool('');
      setToSchool('');
      setCourse('');
      setGrade1(0);
      setGrade2(0);
      setGrade3(0);
      setNote('');
      setShowManualForm(false);
    } catch (err) {
      console.error(err);
      setMessage('Manual transfer failed!');
    }
  };

  const fetchData = async () => {
    try {
      const schoolsRes = await axios.get('http://localhost:8000/api/schools/');
      const coursesRes = await axios.get('http://localhost:8000/api/courses/');
      setSchools(schoolsRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      console.error('Error fetching schools/courses:', err);
    }
  };

  const handleDownloadExcel = () => {
    const excelData = transfers.map(t => ({
      "From School": t.from_school?.name || 'N/A',
      "To School": t.to_school?.name || 'N/A',
      "Course": t.course?.name || 'N/A',
      "Grade 1": t.grade1_students_transferred,
      "Grade 2": t.grade2_students_transferred,
      "Grade 3": t.grade3_students_transferred,
      "Note": t.note,
      "Date": new Date(t.timestamp).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transfers");

    XLSX.writeFile(workbook, "transfers.xlsx");
  };

  useEffect(() => {
    fetchTransfers();
    fetchData();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: 'auto', padding: 20 }}>
      <h1>Transfers</h1>

      <button
        onClick={async () => {
          try {
            await axios.post('http://localhost:8000/api/auto-transfer/');
            setMessage('Auto transfer successful!');
            fetchTransfers();
          } catch (error) {
            console.error('Error during auto transfer:', error);
            setMessage('Auto transfer failed!');
          }
        }}
        style={{ padding: '10px 20px', marginBottom: 10 }}
      >
        Auto Transfer
      </button>

      <button
        onClick={handleDownloadExcel}
        style={{ padding: '10px 20px', marginLeft: 10, backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        Download Excel
      </button>

      <button
        onClick={() => setShowManualForm(true)}
        style={{ padding: '10px 20px', marginLeft: 10, backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        Show Manual Transfer Form
      </button>

      <table border="1" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: 20 }}>
        <thead>
          <tr>
            <th>From School</th>
            <th>To School</th>
            <th>Course</th>
            <th>Grade 1</th>
            <th>Grade 2</th>
            <th>Grade 3</th>
            <th>Note</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transfers.length === 0 ? (
            <tr>
              <td colSpan="9" style={{ textAlign: 'center' }}>No transfers yet</td>
            </tr>
          ) : (
            transfers.map((t, index) => (
              <tr key={index}>
                <td>{t.from_school?.name || 'N/A'}</td>
                <td>{t.to_school?.name || 'N/A'}</td>
                <td>{t.course?.name || 'N/A'}</td>
                <td>{t.grade1_students_transferred}</td>
                <td>{t.grade2_students_transferred}</td>
                <td>{t.grade3_students_transferred}</td>
                <td>{t.note}</td>
                <td>{new Date(t.timestamp).toLocaleString()}</td>
                <td>
                  <button
                    onClick={() => handleReverse(t.id)}
                    style={{ backgroundColor: 'orange', color: 'white', padding: '5px', border: 'none', cursor: 'pointer' }}
                  >
                    Reverse
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {message && (
        <p style={{ color: message.toLowerCase().includes('failed') ? 'red' : 'green', marginTop: 15 }}>{message}</p>
      )}

      {/* Modal Popup for Manual Transfer Form */}
      {showManualForm && (
        <div
          onClick={() => setShowManualForm(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside form
            style={{
              backgroundColor: 'white',
              padding: 30,
              borderRadius: 8,
              width: '90%',
              maxWidth: 600,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowManualForm(false)}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                color: '#888',
              }}
              aria-label="Close"
            >
              &times;
            </button>

            <h2 style={{ fontSize: '1.3rem', marginBottom: 15 }}>Manual Transfer</h2>
            <form onSubmit={handleManualTransfer}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <label style={{ flex: '1 1 45%' }}>
  From School:
  <Select
    options={schoolOptions}
    value={schoolOptions.find(opt => opt.value === fromSchool) || null}
    onChange={selectedOption => setFromSchool(selectedOption ? selectedOption.value : '')}
    isClearable
    placeholder="Select From School"
    styles={{ menu: provided => ({ ...provided, zIndex: 9999 }) }}  // optional, to fix dropdown layering issues
  />
</label>

<label style={{ flex: '1 1 45%' }}>
  To School:
  <Select
    options={schoolOptions}
    value={schoolOptions.find(opt => opt.value === toSchool) || null}
    onChange={selectedOption => setToSchool(selectedOption ? selectedOption.value : '')}
    isClearable
    placeholder="Select To School"
    styles={{ menu: provided => ({ ...provided, zIndex: 9999 }) }}
  />
</label>
              </div>

              <label style={{ marginTop: 15, display: 'block' }}>
                Course:
                <Select
                  name="course_id"
                  options={courseOptions}
                  value={courseOptions.find(opt => opt.value === course) || null}
                  onChange={handleSelectChange}
                  isClearable
                  placeholder="Select Course"
                />
              </label>

              <div style={{ display: 'flex', gap: 10, marginTop: 15, flexWrap: 'wrap' }}>
                <label style={{ flex: '1 1 30%' }}>
                  Grade 1:
                  <input
                    type="number"
                    min="0"
                    value={grade1}
                    onChange={e => setGrade1(e.target.value)}
                    required
                    style={{ width: '100%', marginTop: 5, padding: 5 }}
                  />
                </label>

                <label style={{ flex: '1 1 30%' }}>
                  Grade 2:
                  <input
                    type="number"
                    min="0"
                    value={grade2}
                    onChange={e => setGrade2(e.target.value)}
                    required
                    style={{ width: '100%', marginTop: 5, padding: 5 }}
                  />
                </label>

                <label style={{ flex: '1 1 30%' }}>
                  Grade 3:
                  <input
                    type="number"
                    min="0"
                    value={grade3}
                    onChange={e => setGrade3(e.target.value)}
                    required
                    style={{ width: '100%', marginTop: 5, padding: 5 }}
                  />
                </label>
              </div>

              <label style={{ marginTop: 15, display: 'block' }}>
                Note:
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  style={{ width: '100%', marginTop: 5, padding: 5 }}
                />
              </label>

              <button
                type="submit"
                style={{
                  marginTop: 20,
                  padding: '10px 25px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 4,
                }}
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransfersPage;
