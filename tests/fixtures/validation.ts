/**
 * Test Fixtures: Market Validation Data
 * Sample validation results for testing
 */

export const mockValidationResults = {
  strongOpportunity: {
    idea_id: 'idea-001',
    overall_score: 0.82,
    scores: {
      market_opportunity: 0.85,
      competitive_landscape: 0.78,
      execution_feasibility: 0.88,
      innovation_potential: 0.75
    },
    confidence: {
      overall: 0.90,
      market_opportunity: 0.95,
      competitive_landscape: 0.85,
      execution_feasibility: 0.90,
      innovation_potential: 0.80
    },
    recommendation: 'strong_proceed',
    insights: {
      market_opportunity: [
        'TAM of $500M+ in academic software market',
        'Growing at 15% annually',
        'Clear demand signals: 2M+ monthly searches for "academic paper search"'
      ],
      competitive_landscape: [
        '8 direct competitors identified',
        'Most are enterprise-focused (opportunity in student market)',
        'No dominant player, fragmented market'
      ],
      execution_feasibility: [
        'Can build MVP with no-code tools (Webflow + API integrations)',
        'Free tier of academic APIs available',
        'Estimated 4-6 weeks to launch'
      ],
      innovation_potential: [
        'Unique angle: AI-powered paper summarization',
        'Potential for network effects through collaborative features',
        'Moderate IP opportunities'
      ]
    },
    competitors: [
      { name: 'Google Scholar', strength: 'high', focus: 'general academic search' },
      { name: 'Semantic Scholar', strength: 'medium', focus: 'CS/AI papers' },
      { name: 'Connected Papers', strength: 'medium', focus: 'citation networks' }
    ],
    market_data: {
      search_volume: '2.1M monthly',
      trend: 'growing',
      funding_activity: '$50M+ raised in space (last 12 months)'
    },
    generated_at: '2025-01-15T10:10:00Z'
  },

  weakOpportunity: {
    idea_id: 'idea-002',
    overall_score: 0.42,
    scores: {
      market_opportunity: 0.35,
      competitive_landscape: 0.30,
      execution_feasibility: 0.55,
      innovation_potential: 0.40
    },
    confidence: {
      overall: 0.70,
      market_opportunity: 0.60,
      competitive_landscape: 0.75,
      execution_feasibility: 0.80,
      innovation_potential: 0.65
    },
    recommendation: 'pivot_required',
    insights: {
      market_opportunity: [
        'Small niche market (~100K potential users)',
        'Declining search volume (-15% YoY)',
        'Limited willingness to pay'
      ],
      competitive_landscape: [
        '25+ competitors in crowded space',
        'Dominated by 3 well-funded incumbents',
        'High customer acquisition costs'
      ],
      execution_feasibility: [
        'Moderate technical complexity',
        'Requires partnerships for data access',
        'Regulatory compliance needed'
      ],
      innovation_potential: [
        'Incremental improvement over existing solutions',
        'Low differentiation',
        'Easily copied by competitors'
      ]
    },
    strategic_recommendations: [
      'Consider pivoting to adjacent market with less competition',
      'Focus on specific niche (e.g., medical researchers only)',
      'Explore different pain point in same domain'
    ],
    generated_at: '2025-01-15T11:30:00Z'
  },

  moderateOpportunity: {
    idea_id: 'idea-003',
    overall_score: 0.65,
    scores: {
      market_opportunity: 0.70,
      competitive_landscape: 0.60,
      execution_feasibility: 0.65,
      innovation_potential: 0.65
    },
    confidence: {
      overall: 0.75,
      market_opportunity: 0.80,
      competitive_landscape: 0.70,
      execution_feasibility: 0.75,
      innovation_potential: 0.70
    },
    recommendation: 'proceed_with_refinement',
    insights: {
      market_opportunity: [
        'Moderate market size (~$50M TAM)',
        'Stable growth (5% annually)',
        'Clear but limited demand'
      ],
      competitive_landscape: [
        '5 competitors, none dominant',
        'Differentiation opportunities exist',
        'Could establish niche leadership'
      ],
      execution_feasibility: [
        'Achievable with AI tools and no-code platforms',
        'Some technical challenges but solvable',
        '8-12 weeks to launch estimated'
      ],
      innovation_potential: [
        'Moderate innovation in approach',
        'Potential for unique positioning',
        'Some defensibility through brand/community'
      ]
    },
    refinement_suggestions: [
      'Narrow target audience for clearer positioning',
      'Add unique feature to differentiate from competitors',
      'Consider freemium model to reduce acquisition cost'
    ],
    generated_at: '2025-01-15T12:00:00Z'
  }
};

export const mockMarketData = {
  academicSoftware: {
    tam: 500000000, // $500M
    growth_rate: 0.15,
    search_volume: 2100000, // 2.1M monthly
    trend: 'growing',
    funding_activity: {
      total_raised: 50000000, // $50M
      num_deals: 12,
      period: '12 months'
    }
  },

  competitors: [
    {
      name: 'Google Scholar',
      url: 'https://scholar.google.com',
      strength: 'high',
      funding: 'N/A (Google)',
      users: '100M+',
      features: ['comprehensive search', 'citation tracking', 'free'],
      gaps: ['no collaboration features', 'basic UI', 'no AI summarization']
    },
    {
      name: 'Semantic Scholar',
      url: 'https://semanticscholar.org',
      strength: 'medium',
      funding: '$30M',
      users: '10M+',
      features: ['AI-powered search', 'paper recommendations', 'free'],
      gaps: ['limited to CS/AI papers', 'no mobile app']
    },
    {
      name: 'Connected Papers',
      url: 'https://connectedpapers.com',
      strength: 'medium',
      funding: 'Bootstrapped',
      users: '1M+',
      features: ['visual citation networks', 'paper discovery', 'freemium'],
      gaps: ['no search functionality', 'limited database coverage']
    }
  ]
};
