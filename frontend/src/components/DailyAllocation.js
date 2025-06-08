import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Select from 'react-select';  // Import react-select
import "./DailyAllocation.css";

const DailyAllocation = () => {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [schools, setSchools] = useState([]);
  const [courses, setCourses] = useState([]);

  // Now selectedSchool and selectedCourse will store the ID string (or empty string)
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  useEffect(() => {
    fetchSchools();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedSchool && selectedCourse) {
      fetchAllocations(selectedSchool, selectedCourse);
    } else {
      setAllocations([]);
    }
  }, [selectedSchool, selectedCourse]);

  const fetchSchools = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/schools/');
      setSchools(response.data);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/courses/');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchAllocations = async (schoolId, courseId) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/api/daily-allocation/?school=${schoolId}&course=${courseId}`);
      setAllocations(response.data);
    } catch (error) {
      console.error('Error fetching allocations:', error);
      setAllocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    const data = allocations.map((day) => ({
      Day: day.day,
      'Grade 1': day.grade1,
      'Grade 2': day.grade2,
      'Grade 3': day.grade3,
      'Assessors Needed': day.assessors_needed,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Allocation');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    saveAs(blob, 'Daily_Exam_Allocations.xlsx');
  };

  // Convert schools and courses to react-select format:
  const schoolOptions = schools.map(school => ({ value: school.id, label: school.name }));
  const courseOptions = courses.map(course => ({ value: course.id, label: course.name }));

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Daily Exam Allocations</h1>

      {/* Dropdown selectors */}
      <div className="mb-4 flex gap-4">
        <div style={{ flex: 1 }}>
          <label className="block mb-1 font-semibold">Select School:</label>
          <Select
            options={schoolOptions}
            value={schoolOptions.find(option => option.value === selectedSchool) || null}
            onChange={option => setSelectedSchool(option ? option.value : '')}
            placeholder="Select School"
            isClearable
          />
        </div>

        <div style={{ flex: 1 }}>
          <label className="block mb-1 font-semibold">Select Course:</label>
          <Select
            options={courseOptions}
            value={courseOptions.find(option => option.value === selectedCourse) || null}
            onChange={option => setSelectedCourse(option ? option.value : '')}
            placeholder="Select Course"
            isClearable
          />
        </div>
      </div>

      {/* Allocation table or message */}
      {loading ? (
        <p>Loading allocation data...</p>
      ) : allocations.length === 0 ? (
        <p>Please select both school and course to view allocations.</p>
      ) : (
        <>
          <button
            onClick={handleDownloadExcel}
            className="mb-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Download Excel
          </button>

          <div className="overflow-x-auto">
            <table className="table-auto w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">Day</th>
                  <th className="px-4 py-2 border">Grade 1</th>
                  <th className="px-4 py-2 border">Grade 2</th>
                  <th className="px-4 py-2 border">Grade 3</th>
                  <th className="px-4 py-2 border">Assessors Needed</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((day, index) => (
                  <tr key={index} className="text-center">
                    <td className="border px-4 py-2">{day.day}</td>
                    <td className="border px-4 py-2">{day.grade1}</td>
                    <td className="border px-4 py-2">{day.grade2}</td>
                    <td className="border px-4 py-2">{day.grade3}</td>
                    <td className="border px-4 py-2">{day.assessors_needed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default DailyAllocation;
