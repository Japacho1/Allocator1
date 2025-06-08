import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent } from './ui/Card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useAssessor } from './AssessorContext'; // ✅ Import context

const Dashboard = ({ report }) => {
  const [stats, setStats] = useState({
    totalSchools: 0,
    courses: [],
    totalDaysAvailable: 0,
  });

  const [selectedCourse, setSelectedCourse] = useState(null);
  const { assessors, setAssessors } = useAssessor(); // ✅ include setAssessors

  // Fetch dashboard stats
  useEffect(() => {
    axios.get('http://localhost:8000/api/dashboard-stats')
      .then(response => {
        setStats(response.data);
        if (response.data.courses.length > 0) {
          setSelectedCourse(response.data.courses[0]);
        }
      })
      .catch(error => {
        console.error('Failed to fetch dashboard data:', error);
      });
  }, []);

  // Fetch and calculate needed assessors based on days available
  useEffect(() => {
    axios.get('http://localhost:8000/api/allocation/')
      .then(res => {
        const totalAvailable = res.data.reduce((sum, item) => {
          return sum + (parseInt(item.total_days_available) || 0);
        }, 0);

        const totalNeeded = Math.ceil(totalAvailable / 12); // Assume 12 working days
        const fakeAssessors = Array.from({ length: totalNeeded }, (_, i) => ({ id: i + 1 }));

        setAssessors(fakeAssessors);
      })
      .catch(err => {
        console.error('Failed to fetch assessor data:', err);
      });
  }, [setAssessors]);

  const handleCourseChange = (event) => {
    const courseName = event.target.value;
    const course = stats.courses.find(c => c.name === courseName);
    setSelectedCourse(course);
  };

  const totalStudentsAllCourses = stats.courses.reduce((sum, course) => sum + course.totalStudents, 0);

  return (
    <div className="p-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <Card>
          <CardContent>
            <h2 className="text-xl font-bold mb-2">Total Schools</h2>
            <p className="text-3xl">{stats.totalSchools}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="text-xl font-bold mb-2">Total Students (All Courses)</h2>
            <p className="text-3xl">{totalStudentsAllCourses}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="text-xl font-bold mb-2">Total Assessors (Needed)</h2>
            <p className="text-3xl">{assessors.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Course Selector */}
      <div className="mb-4 max-w-sm">
        <label htmlFor="course-select" className="block mb-1 font-semibold">Select Course:</label>
        <select
          id="course-select"
          className="border border-gray-300 rounded p-2 w-full"
          onChange={handleCourseChange}
          value={selectedCourse ? selectedCourse.name : ''}
        >
          {stats.courses.map((course, index) => (
            <option key={index} value={course.name}>
              {course.name}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Course Breakdown */}
      {selectedCourse && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-bold mb-1">{selectedCourse.name}</h3>
            <p>Schools Offering: <strong>{selectedCourse.schoolCount}</strong></p>
            <p>Total Students: <strong>{selectedCourse.totalStudents}</strong></p>
            <div className="mt-2" style={{ width: '100%', height: 150 }}>
              <ResponsiveContainer>
                <BarChart data={[
                  { grade: 'Grade 1', students: selectedCourse.grade1 },
                  { grade: 'Grade 2', students: selectedCourse.grade2 },
                  { grade: 'Grade 3', students: selectedCourse.grade3 },
                ]}>
                  <XAxis dataKey="grade" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="students" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
