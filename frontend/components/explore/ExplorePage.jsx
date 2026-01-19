import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NewsCard from './NewsCard';
import CategoryTabs from './CategoryTabs';
import SearchBar from './SearchBar';
import './ExplorePage.css';

const ExplorePage = () => {
  const navigate = useNavigate();
  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Categories for tabs
  const categories = ['All', 'Technology', 'Global', 'Finance', 'Science', 'Security'];

  // Fetch articles from backend
  const fetchArticles = async (category) => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockArticles = [
        {
          id: 1,
          title: 'Quantum Computing Breakthrough Reaches 99.9% Fidelity',
          description: 'Researchers achieve new milestone in qubit stability, paving the way for practical quantum computers in the next decade.',
          content: 'Full article content here...',
          image_url: 'https://via.placeholder.com/400x300',
          category: 'Science',
          published_at: '2025-01-12T10:00:00Z',
          source_name: 'TechNews',
          url: 'https://example.com/article1'
        },
        {
          id: 2,
          title: 'Global Markets Shift as Renewable Energy Surpasses Coal',
          description: 'For the first time in history, global renewable energy output has exceeded coal production.',
          content: 'Full article content here...',
          image_url: 'https://via.placeholder.com/400x300',
          category: 'Finance',
          published_at: '2025-01-12T09:30:00Z',
          source_name: 'FinanceDaily',
          url: 'https://example.com/article2'
        },
        {
          id: 3,
          title: 'New AI Regulation Framework Proposed by EU Commission',
          description: 'Draft legislation outlines AI safety protocols across member states with strict compliance requirements.',
          content: 'Full article content here...',
          image_url: 'https://via.placeholder.com/400x300',
          category: 'Global',
          published_at: '2025-01-12T08:45:00Z',
          source_name: 'GlobalNews',
          url: 'https://example.com/article3'
        },
        {
          id: 4,
          title: 'Cybersecurity Threats Rise 300% in Q4 2024',
          description: 'Security researchers warn of new sophisticated attack vectors targeting enterprise infrastructure.',
          content: 'Full article content here...',
          image_url: 'https://via.placeholder.com/400x300',
          category: 'Security',
          published_at: '2025-01-12T07:15:00Z',
          source_name: 'SecurityWatch',
          url: 'https://example.com/article4'
        },
        {
          id: 5,
          title: 'Revolutionary Battery Technology Doubles EV Range',
          description: 'New solid-state battery design promises to transform electric vehicle industry with 1000km range.',
          content: 'Full article content here...',
          image_url: 'https://via.placeholder.com/400x300',
          category: 'Technology',
          published_at: '2025-01-12T06:20:00Z',
          source_name: 'AutoTech',
          url: 'https://example.com/article5'
        },
        {
          id: 6,
          title: 'Mars Colony Planning Enters Final Phase',
          description: 'Space agencies collaborate on comprehensive roadmap for sustainable human settlement on Mars by 2035.',
          content: 'Full article content here...',
          image_url: 'https://via.placeholder.com/400x300',
          category: 'Science',
          published_at: '2025-01-12T05:30:00Z',
          source_name: 'SpaceDaily',
          url: 'https://example.com/article6'
        }
      ];

      const filteredArticles = category === 'All' 
        ? mockArticles 
        : mockArticles.filter(article => article.category === category);

      setArticles(filteredArticles);
    } catch (err) {
      setError('Failed to fetch articles. Please try again later.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Effect: Fetch articles when component mounts or category changes
  useEffect(() => {
    fetchArticles(activeCategory);
  }, [activeCategory]);

  // Handle category change from CategoryTabs
  const handleCategoryChange = useCallback((category) => {
    setActiveCategory(category);
  }, []);

  // Handle search query change from SearchBar
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Filter articles based on search query
  const filteredArticles = articles.filter(article => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(query) ||
      article.description.toLowerCase().includes(query) ||
      article.source_name.toLowerCase().includes(query)
    );
  });

  // Handle article interaction
  const handleArticleInteraction = useCallback(async (articleId, interactionType) => {
    try {
      const userId = localStorage.getItem('user_id');
      
      if (!userId) {
        console.log('User not logged in');
        return;
      }

      console.log(`Interaction logged: ${interactionType} on article ${articleId}`);
    } catch (err) {
      console.error('Failed to log interaction:', err);
    }
  }, []);

  // Handle article click - navigate to detail page
  const handleArticleClick = useCallback((articleId) => {
    navigate(`/article/${articleId}`);
  }, [navigate]);

  const pageContainerStyle = {
    width: '100%',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px 24px'
  };

  const headerStyle = {
    marginBottom: '32px'
  };

  const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: '800',
    margin: '0 0 24px 0',
    letterSpacing: '-0.03em'
  };

  const searchContainerStyle = {
    marginBottom: '24px'
  };

  const tabsContainerStyle = {
    marginBottom: '32px'
  };

  const resultsCountStyle = {
    fontSize: '0.9375rem',
    opacity: '0.7',
    marginBottom: '20px'
  };

  const loadingStyle = {
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '1.125rem'
  };

  const errorStyle = {
    textAlign: 'center',
    padding: '60px 20px'
  };

  const errorTextStyle = {
    fontSize: '1.125rem',
    marginBottom: '16px'
  };

  const retryButtonStyle = {
    padding: '10px 24px',
    fontSize: '1rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '28px',
    width: '100%'
  };

  const emptyStateStyle = {
    textAlign: 'center',
    padding: '80px 20px'
  };

  const emptyTextStyle = {
    fontSize: '1.125rem',
    marginBottom: '16px',
    opacity: '0.7'
  };

  const clearButtonStyle = {
    padding: '10px 24px',
    fontSize: '1rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600'
  };

  return (
    <div className="explore-page">
      {/* Header Section */}
      <div className="explore-header">
        <h1 className="explore-title">Explore Topics</h1>
      </div>

      {/* Search Bar Component */}
      <div className="explore-search-container">
        <SearchBar 
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search for specific topics, companies, or events..."
        />
      </div>

      {/* Category Tabs Component */}
      <div className="explore-tabs-container">
        <CategoryTabs 
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      </div>

      {/* Results Count */}
      {searchQuery && (
        <div className="explore-results-count">
          <p>Found {filteredArticles.length} articles matching "{searchQuery}"</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="explore-loading">
          <p>Loading articles...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="explore-error">
          <p>{error}</p>
          <button 
            className="explore-retry-btn"
            onClick={() => fetchArticles(activeCategory)}
          >
            Retry
          </button>
        </div>
      )}

      {/* Articles Grid */}
      {!loading && !error && (
        <div className="explore-grid">
          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                onInteraction={handleArticleInteraction}
                onClick={handleArticleClick}
              />
            ))
          ) : (
            <div className="explore-empty-state">
              <p className="explore-empty-text">No articles found matching your criteria.</p>
              {searchQuery && (
                <button 
                  className="explore-clear-btn"
                  onClick={() => setSearchQuery('')}
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExplorePage;