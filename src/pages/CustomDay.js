import React from 'react';
import { dateFnsLocalizer } from 'react-big-calendar'; // Ensure you're importing from the right library

const CustomDay = ({ date, onClick, ...props }) => {
  const handleClick = () => {
    onClick(date);
  };

  return (
    <div
      {...props}
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        padding: '10px',
        border: '1px solid #ddd',
        backgroundColor: '#f9f9f9',
        ...props.style
      }}
    >
      {props.children}
    </div>
  );
};

export default CustomDay;
