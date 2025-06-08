import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './AllocationDashboard.css';
import { useAssessor } from './AssessorContext'; // import context hook

function AllocationDashboard() {
  const [report, setReport] = useState([]);
  const [message, setMessage] = useState('');

  // 👇 Using context
  const {
    assessors,
    setAssessors,
    assessorCount,
    setAssessorCount
  } = useAssessor();

  useEffect(() => {
    axios.get('http://localhost:8000/api/allocation/')
      .then(res => {
        setReport(res.data);

        // 👇 Calculate total assessor count from total available days
        const totalAvailable = res.data.reduce(
          (sum, item) => sum + (parseInt(item.total_days_available) || 0), 0
        );

        const count = Math.ceil(totalAvailable / 12); // Each assessor works 12 days
        setAssessorCount(count); // 👈 Update context
      })
      .catch(err => console.error(err));
  }, [setAssessorCount]);

  const refresh = () => {
    window.location.href = '/';
  };

  const handleDownloadExcel = () => {
    const data = report.map(item => ({
      School: item.school,
      Course: item.course,
      'Grade 1 Day 1': item.grade1_students_day1,
      'Total Grade 1': item.grade1_total_students,
      'Grade 2 Day 1': item.grade2_students_day1,
      'Total Grade 2': item.grade2_total_students,
      'Grade 3 Day 1': item.grade3_students_day1,
      'Total Grade 3': item.grade3_total_students,
      'Total Students': item.total_students,
      'Days Needed': item.total_days_needed,
      'Days Available': item.total_days_available,
      Status: item.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Allocation Summary');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    saveAs(blob, 'Allocation_Summary.xlsx');
  };

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <h2>Exam Allocation Summary</h2>
        <p style={{ fontWeight: 'bold' }}>Total Assessors Required: {assessorCount}</p>

        <div className="button-group">
          <button onClick={refresh}>Refresh allocation</button>
          <button onClick={handleDownloadExcel} style={{ marginLeft: '10px' }}>
            Download Excel
          </button>
        </div>

        {message && (
          <p style={{ color: message.includes('failed') ? 'red' : 'green', marginTop: 10 }}>
            {message}
          </p>
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>School</th>
                <th>Course</th>
                <th>Grade 1 Day 1</th>
                <th>Total Grade 1</th>
                <th>Grade 2 Day 1</th>
                <th>Total Grade 2</th>
                <th>Grade 3 Day 1</th>
                <th>Total Grade 3</th>
                <th>Total Students</th>
                <th>Days Needed</th>
                <th>Days Available</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {report.map((item, index) => (
                <tr key={index}>
                  <td>{item.school}</td>
                  <td>{item.course}</td>
                  <td>{item.grade1_students_day1}</td>
                  <td>{item.grade1_total_students}</td>
                  <td>{item.grade2_students_day1}</td>
                  <td>{item.grade2_total_students}</td>
                  <td>{item.grade3_students_day1}</td>
                  <td>{item.grade3_total_students}</td>
                  <td>{item.total_students}</td>
                  <td>{item.total_days_needed}</td>
                  <td>{item.total_days_available}</td>
                  <td className={item.status === 'Sufficient' ? 'status-ok' : 'status-warn'}>
                    {item.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AllocationDashboard;
