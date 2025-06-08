// AssessorContext.js
import React, { createContext, useContext, useState } from 'react';

export const AssessorContext = createContext();

export const AssessorProvider = ({ children }) => {
  const [assessors, setAssessors] = useState([]);
  const [assessorCount, setAssessorCount] = useState(0); // ✅ new state

  return (
    <AssessorContext.Provider value={{
      assessors,
      setAssessors,
      assessorCount,
      setAssessorCount
    }}>
      {children}
    </AssessorContext.Provider>
  );
};

export const useAssessor = () => {
  return useContext(AssessorContext);
};
