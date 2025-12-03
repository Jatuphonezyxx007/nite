import React from "react";
import "./Pagination.css";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisibleButtons = 5;

    if (totalPages <= maxVisibleButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      if (startPage === 1) endPage = Math.min(5, totalPages);
      if (endPage === totalPages) startPage = Math.max(1, totalPages - 4);

      for (let i = startPage; i <= endPage; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div className="pagination-container">
      <button
        className="page-btn nav"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <span className="material-symbols-rounded">chevron_left</span>
      </button>

      {getPageNumbers().map((page) => (
        <button
          key={page}
          className={`page-btn ${currentPage === page ? "active" : ""}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      <button
        className="page-btn nav"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <span className="material-symbols-rounded">chevron_right</span>
      </button>
    </div>
  );
};

export default Pagination;
