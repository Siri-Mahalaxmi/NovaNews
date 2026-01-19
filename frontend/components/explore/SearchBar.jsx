import React, { useState, useEffect, useRef } from 'react';
import './SearchBar.css';

const SearchBar = ({ value, onChange, placeholder }) => {
  const [localValue, setLocalValue] = useState(value);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      onChange(localValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localValue]);

  const handleInputChange = (e) => {
    setLocalValue(e.target.value);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onChange(localValue);
  };

  return (
    <div className="search-bar-container">
      <form className="search-bar-form" onSubmit={handleSubmit}>
        <span className="search-bar-icon">🔍</span>

        <input
          type="text"
          className="search-bar-input"
          value={localValue}
          onChange={handleInputChange}
          placeholder={placeholder || "Search for specific topics, companies, or events..."}
          aria-label="Search articles"
        />

        {localValue && (
          <button
            type="button"
            className="search-bar-clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </form>
    </div>
  );
};

export default SearchBar;