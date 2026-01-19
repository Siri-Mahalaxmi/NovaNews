import React from 'react';
import './CategoryTabs.css';

const CategoryTabs = ({ categories, activeCategory, onCategoryChange }) => {
  
  const handleTabClick = (category) => {
    if (category !== activeCategory) {
      onCategoryChange(category);
    }
  };

  const getCategoryIcon = (category) => {
    const iconMap = {
      'All': '⊞',
      'Technology': '💻',
      'Global': '🌐',
      'Finance': '📈',
      'Science': '🔬',
      'Security': '🔒'
    };
    
    return iconMap[category] || '📰';
  };

  return (
    <div className="category-tabs-container">
      <div className="category-tabs">
        {categories.map((category) => {
          const isActive = activeCategory === category;
          
          return (
            <button
              key={category}
              className={`category-tab ${isActive ? 'active' : ''}`}
              onClick={() => handleTabClick(category)}
              disabled={isActive}
              aria-selected={isActive}
              role="tab"
            >
              <span className="category-tab-icon">{getCategoryIcon(category)}</span>
              <span>{category}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryTabs;