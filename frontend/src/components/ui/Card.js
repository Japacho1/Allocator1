import React from 'react';
import './Card.css'; // optional for styling

export function Card({ children }) {
  return (
    <div className="card">
      {children}
    </div>
  );
}

export function CardContent({ children }) {
  return <div className="mt-2">{children}</div>;
}
