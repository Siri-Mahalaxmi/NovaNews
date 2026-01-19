import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ArticleDetailPage.css';

const ArticleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArticleDetail();
  }, [id]);

  const fetchArticleDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`http://localhost:8000/articles/${id}`);
      // const data = await response.json();
      // setArticle(data);

      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockArticles = {
        1: {
          id: 1,
          title: 'Quantum Computing Breakthrough Reaches 99.9% Fidelity',
          description: 'Researchers achieve new milestone in qubit stability, paving the way for practical quantum computers in the next decade.',
          content: `In a groundbreaking development, researchers at the Quantum Computing Institute have achieved a remarkable 99.9% fidelity rate in quantum bit operations, marking a significant milestone in the quest for practical quantum computing.

The breakthrough, published in the journal Nature Physics, demonstrates unprecedented stability in quantum systems that could revolutionize computing as we know it. The team successfully maintained quantum coherence for extended periods, solving one of the most persistent challenges in the field.

Dr. Sarah Chen, lead researcher on the project, explains: "This achievement represents years of dedicated work in quantum error correction and system design. We've essentially created a quantum processor that can perform calculations with an accuracy that makes real-world applications feasible."

The implications are profound. Quantum computers operating at this fidelity level could tackle complex problems in drug discovery, climate modeling, and cryptography that are currently impossible for classical computers. Industries from pharmaceuticals to finance are already expressing keen interest.

The breakthrough came through a novel approach to quantum error correction, combined with innovative cooling techniques that maintain qubits at near absolute zero temperatures. The team also developed new materials for quantum gates that significantly reduce interference.

However, challenges remain. Scaling this technology to larger quantum systems while maintaining the same fidelity rates presents significant engineering hurdles. The research team estimates that practical, large-scale quantum computers could be available within the next decade, though more conservative estimates suggest 15-20 years.

Investment in quantum computing has surged following this announcement, with several tech giants announcing expanded quantum research programs. The race to quantum supremacy is accelerating, and this breakthrough has positioned the research team at the forefront of this technological revolution.`,
          image_url: 'https://via.placeholder.com/1200x600',
          category: 'Science',
          published_at: '2025-01-12T10:00:00Z',
          source_name: 'TechNews',
          url: 'https://example.com/article1',
          author: 'Dr. Michael Roberts'
        },
        2: {
          id: 2,
          title: 'Global Markets Shift as Renewable Energy Surpasses Coal',
          description: 'For the first time in history, global renewable energy output has exceeded coal production.',
          content: `In a historic turning point for global energy markets, renewable energy sources have officially surpassed coal in total global electricity generation for the first time since the industrial revolution.

The milestone, confirmed by the International Energy Agency (IEA), marks a fundamental shift in how the world powers itself. Solar and wind energy led the charge, with combined capacity growing by 35% year-over-year.

"This is not just an environmental victory—it's an economic one," says Maria Gonzalez, Chief Energy Analyst at the IEA. "Renewable energy is now cheaper, more reliable, and more abundant than fossil fuels in most markets worldwide."

The transition has been driven by dramatic cost reductions in solar panel manufacturing, improved wind turbine efficiency, and massive investments in energy storage technologies. Battery storage costs have fallen by 80% over the past decade, solving the intermittency challenge that long plagued renewables.

Major economies are racing to expand renewable capacity. China leads with 45% of global renewable installations, followed by the United States at 18% and the European Union at 22%. India has emerged as a rapidly growing player, with ambitious targets to achieve 50% renewable energy by 2030.

Coal's decline has been swift. In the past five years alone, over 200 coal plants worldwide have been retired or converted to cleaner fuels. The coal industry employed 7 million people globally in 2020; that number has dropped to 4.2 million today.

However, the transition isn't without challenges. Job losses in coal regions have created economic hardship, requiring substantial investment in retraining programs and economic diversification. Grid infrastructure also needs significant upgrades to handle the distributed nature of renewable generation.

Financial markets have responded dramatically. Clean energy stocks have outperformed traditional energy companies by 300% over the past three years. Major investment firms are divesting from fossil fuels, accelerating the industry's transformation.

The implications for climate change are significant. The IEA projects that if current trends continue, global carbon emissions from electricity generation could peak as early as 2027 and decline thereafter—a crucial development in meeting Paris Agreement targets.`,
          image_url: 'https://via.placeholder.com/1200x600',
          category: 'Finance',
          published_at: '2025-01-12T09:30:00Z',
          source_name: 'FinanceDaily',
          url: 'https://example.com/article2',
          author: 'Jennifer Liu'
        },
        3: {
          id: 3,
          title: 'New AI Regulation Framework Proposed by EU Commission',
          description: 'Draft legislation outlines AI safety protocols across member states with strict compliance requirements.',
          content: `The European Commission has unveiled comprehensive draft legislation to regulate artificial intelligence systems, establishing the world's most stringent framework for AI safety and accountability.

The proposed AI Act categorizes AI systems into risk levels—unacceptable, high, limited, and minimal—with corresponding regulatory requirements. High-risk applications in healthcare, law enforcement, and critical infrastructure face the strictest oversight.

"We're creating a framework that fosters innovation while protecting fundamental rights," explains Commissioner Margrethe Vestager. "AI systems that could significantly impact people's lives must be transparent, accountable, and safe."

The legislation mandates rigorous testing, documentation, and human oversight for high-risk AI applications. Companies must conduct impact assessments and maintain detailed logs of AI decision-making processes. Non-compliance could result in fines up to 6% of global revenue.

Tech companies have expressed mixed reactions. While some applaud the clarity, others warn that overly restrictive regulations could stifle innovation and put European companies at a competitive disadvantage against less-regulated markets.

The framework includes specific provisions for generative AI systems, requiring clear labeling of AI-generated content and prohibitions on certain deceptive practices. Biometric identification in public spaces faces severe restrictions, with narrow exceptions for law enforcement.

Member states now enter a consultation period, with final passage expected by late 2026. Implementation will be phased over two years, giving companies time to achieve compliance. The Commission has allocated €1.5 billion to support compliance efforts and AI safety research.

International observers are watching closely, as the EU's regulatory approach often influences global standards. Several countries, including Japan and Canada, have indicated they may adopt similar frameworks.`,
          image_url: 'https://via.placeholder.com/1200x600',
          category: 'Global',
          published_at: '2025-01-12T08:45:00Z',
          source_name: 'GlobalNews',
          url: 'https://example.com/article3',
          author: 'Thomas Anderson'
        }
      };

      const articleData = mockArticles[id];
      if (!articleData) {
        throw new Error('Article not found');
      }

      setArticle(articleData);
    } catch (err) {
      setError('Failed to load article. Please try again later.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const published = new Date(timestamp);
    const diffMs = now - published;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <div className="article-detail-page">
        <div className="article-loading">
          <p>Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="article-detail-page">
        <div className="article-error">
          <p>{error || 'Article not found'}</p>
          <button className="article-back-btn" onClick={handleGoBack}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="article-detail-page">
      <div className="article-detail-container">
        {/* Back Button */}
        <button className="article-back-btn-top" onClick={handleGoBack}>
          <span>←</span>
          <span>Back to Explore</span>
        </button>

        {/* Article Header */}
        <div className="article-header">
          <div className="article-category-badge">{article.category}</div>
          <h1 className="article-title">{article.title}</h1>
          
          <div className="article-meta">
            <div className="article-source">
              <span className="article-source-name">{article.source_name}</span>
              {article.author && (
                <>
                  <span className="article-meta-separator">•</span>
                  <span className="article-author">By {article.author}</span>
                </>
              )}
            </div>
            <div className="article-timestamp">
              {getTimeAgo(article.published_at)}
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {article.image_url && (
          <div className="article-image-container">
            <img 
              src={article.image_url} 
              alt={article.title}
              className="article-image"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/1200x600?text=No+Image';
              }}
            />
          </div>
        )}

        {/* Article Content */}
        <div className="article-content">
          <div className="article-description">
            {article.description}
          </div>
          
          <div className="article-body">
            {article.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="article-paragraph">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Article Footer */}
        <div className="article-footer">
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="article-source-link"
          >
            Read original article at {article.source_name} →
          </a>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetailPage;