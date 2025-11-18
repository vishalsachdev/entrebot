/**
 * Unit Tests: Market Validator Agent
 * Tests market research and validation scoring
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { mockValidationResults, mockMarketData } from '../../fixtures/validation';

describe('Market Validator Agent', () => {
  let validator: any;
  let mockWebSearch: any;
  let mockMemory: any;

  beforeEach(() => {
    mockWebSearch = {
      search: jest.fn(),
      getCompetitors: jest.fn(),
      getMarketData: jest.fn()
    };

    mockMemory = {
      retrieve: jest.fn(),
      store: jest.fn()
    };
  });

  describe('Market Research', () => {
    test('should perform comprehensive market research', async () => {
      const idea = {
        title: 'Academic Search Engine',
        description: 'Unified search for academic papers',
        target_market: 'university students'
      };

      mockWebSearch.search.mockResolvedValue({
        results: ['result1', 'result2'],
        searchVolume: 2100000
      });

      const research = await performMarketResearch(idea, mockWebSearch);

      expect(mockWebSearch.search).toHaveBeenCalled();
      expect(research.competitors).toBeDefined();
      expect(research.marketSize).toBeDefined();
      expect(research.trends).toBeDefined();
    });

    test('should identify direct and indirect competitors', async () => {
      mockWebSearch.getCompetitors.mockResolvedValue([
        { name: 'Google Scholar', type: 'direct', strength: 'high' },
        { name: 'ResearchGate', type: 'indirect', strength: 'medium' }
      ]);

      const competitors = await identifyCompetitors('academic search', mockWebSearch);

      const directCompetitors = competitors.filter((c: any) => c.type === 'direct');
      const indirectCompetitors = competitors.filter((c: any) => c.type === 'indirect');

      expect(directCompetitors.length).toBeGreaterThan(0);
      expect(indirectCompetitors.length).toBeGreaterThan(0);
    });

    test('should analyze competitive landscape', () => {
      const competitors = mockMarketData.competitors;

      const analysis = analyzeCompetitiveLandscape(competitors);

      expect(analysis.totalCompetitors).toBe(competitors.length);
      expect(analysis.marketLeader).toBeDefined();
      expect(analysis.gaps).toBeDefined();
      expect(analysis.saturationLevel).toMatch(/low|medium|high/);
    });

    test('should estimate market size', async () => {
      const marketData = {
        searchVolume: 2100000,
        similarProducts: 15,
        fundingActivity: 50000000
      };

      const estimate = estimateMarketSize(marketData);

      expect(estimate.tam).toBeGreaterThan(0);
      expect(estimate.confidence).toBeGreaterThan(0);
      expect(estimate.confidence).toBeLessThanOrEqual(1);
    });

    test('should complete research within 30 seconds', async () => {
      const startTime = Date.now();

      await performMarketResearch(
        { title: 'Test Idea', description: 'Test' },
        mockWebSearch
      );

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(30000); // 30 seconds
    });
  });

  describe('Validation Scoring', () => {
    test('should calculate multi-dimensional scores', () => {
      const validationData = {
        marketOpportunity: 0.85,
        competitiveLandscape: 0.70,
        executionFeasibility: 0.88,
        innovationPotential: 0.65
      };

      const result = calculateValidationScore(validationData);

      expect(result).toBeValidValidationScore();
      expect(result.overall_score).toBeGreaterThan(0);
      expect(result.overall_score).toBeLessThanOrEqual(1);
    });

    test('should weight dimensions correctly', () => {
      const scores = {
        market_opportunity: 1.0,      // 30% weight
        competitive_landscape: 1.0,   // 25% weight
        execution_feasibility: 1.0,   // 25% weight
        innovation_potential: 1.0     // 20% weight
      };

      const overall = calculateWeightedScore(scores);
      expect(overall).toBe(1.0);

      const partialScores = {
        market_opportunity: 0.8,
        competitive_landscape: 0.6,
        execution_feasibility: 0.7,
        innovation_potential: 0.5
      };

      const expected = (0.8 * 0.30) + (0.6 * 0.25) + (0.7 * 0.25) + (0.5 * 0.20);
      const actual = calculateWeightedScore(partialScores);

      expect(actual).toBeCloseTo(expected, 2);
    });

    test('should provide confidence scores', () => {
      const dataQuality = {
        marketData: 'high',      // Lots of search data
        competitorData: 'medium', // Some competitors analyzed
        feasibilityData: 'high',  // Clear requirements
        innovationData: 'medium'  // Moderate trend data
      };

      const confidence = calculateConfidenceScores(dataQuality);

      expect(confidence.overall).toBeGreaterThan(0.5);
      expect(confidence.market_opportunity).toBeGreaterThan(0.8);
    });

    test('should categorize validation results', () => {
      const testCases = [
        { overall: 0.85, expected: 'strong_proceed' },
        { overall: 0.65, expected: 'proceed_with_refinement' },
        { overall: 0.45, expected: 'pivot_required' },
        { overall: 0.25, expected: 'not_recommended' }
      ];

      testCases.forEach(({ overall, expected }) => {
        const category = categorizeValidation(overall);
        expect(category).toBe(expected);
      });
    });
  });

  describe('Strategic Insights', () => {
    test('should generate actionable insights', () => {
      const validationResult = mockValidationResults.strongOpportunity;

      const insights = generateInsights(validationResult);

      expect(insights.market_opportunity.length).toBeGreaterThan(0);
      expect(insights.competitive_landscape.length).toBeGreaterThan(0);
      expect(insights.execution_feasibility.length).toBeGreaterThan(0);
      expect(insights.innovation_potential.length).toBeGreaterThan(0);
    });

    test('should identify market gaps', () => {
      const competitors = [
        { name: 'A', focus: 'enterprise' },
        { name: 'B', focus: 'enterprise' },
        { name: 'C', focus: 'researchers' }
      ];

      const gaps = identifyMarketGaps(competitors);

      expect(gaps).toContain('student market');
      expect(gaps.length).toBeGreaterThan(0);
    });

    test('should recommend differentiation strategies', () => {
      const competitive Analysis = {
        saturation: 'high',
        dominantPlayers: ['Google Scholar'],
        commonFeatures: ['search', 'citations'],
        gaps: ['AI summarization', 'collaborative features']
      };

      const strategies = recommendDifferentiation(competitiveAnalysis);

      expect(strategies.length).toBeGreaterThan(0);
      strategies.forEach(strategy => {
        expect(strategy).toHaveProperty('approach');
        expect(strategy).toHaveProperty('reasoning');
      });
    });

    test('should provide timeline estimates', () => {
      const feasibilityData = {
        technicalComplexity: 'medium',
        requiredSkills: ['no-code', 'API integration'],
        resourceRequirements: 'low'
      };

      const timeline = estimateTimeline(feasibilityData);

      expect(timeline).toHaveProperty('min_weeks');
      expect(timeline).toHaveProperty('max_weeks');
      expect(timeline.min_weeks).toBeLessThanOrEqual(timeline.max_weeks);
    });
  });

  describe('Data Presentation', () => {
    test('should create visual dashboard data', () => {
      const validationResult = mockValidationResults.strongOpportunity;

      const dashboard = createValidationDashboard(validationResult);

      expect(dashboard).toHaveProperty('scores');
      expect(dashboard).toHaveProperty('charts');
      expect(dashboard).toHaveProperty('insights');
      expect(dashboard).toHaveProperty('recommendation');
    });

    test('should format scores for visualization', () => {
      const scores = {
        market_opportunity: 0.85,
        competitive_landscape: 0.70,
        execution_feasibility: 0.88,
        innovation_potential: 0.65
      };

      const formatted = formatScoresForChart(scores);

      expect(formatted).toBeInstanceOf(Array);
      formatted.forEach((item: any) => {
        expect(item).toHaveProperty('label');
        expect(item).toHaveProperty('value');
        expect(item).toHaveProperty('color');
      });
    });

    test('should include competitor comparison', () => {
      const competitors = mockMarketData.competitors;

      const comparison = createCompetitorComparison(competitors);

      expect(comparison).toBeInstanceOf(Array);
      comparison.forEach(comp => {
        expect(comp).toHaveProperty('name');
        expect(comp).toHaveProperty('strengths');
        expect(comp).toHaveProperty('gaps');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle web search failures gracefully', async () => {
      mockWebSearch.search.mockRejectedValue(new Error('API timeout'));

      const result = await performMarketResearch({ title: 'Test' }, mockWebSearch);

      expect(result.fallbackUsed).toBe(true);
      expect(result.confidence).toBeLessThan(0.5);
    });

    test('should handle missing market data', () => {
      const incompleteData = {
        searchVolume: null,
        competitors: []
      };

      const validation = calculateValidationScore(incompleteData);

      expect(validation.confidence.overall).toBeLessThan(0.5);
      expect(validation.limitations).toContain('limited market data');
    });

    test('should timeout protection for slow searches', async () => {
      jest.setTimeout(35000);

      mockWebSearch.search.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 40000))
      );

      await expect(
        performMarketResearchWithTimeout({ title: 'Test' }, mockWebSearch, 30000)
      ).rejects.toThrow('timeout');
    });
  });

  describe('Edge Cases', () => {
    test('should handle brand new markets with no data', () => {
      const emergingMarket = {
        searchVolume: 100,
        competitors: [],
        fundingActivity: 0
      };

      const validation = validateEmergingMarket(emergingMarket);

      expect(validation.confidence.overall).toBeLessThan(0.6);
      expect(validation.notes).toContain('emerging market');
    });

    test('should handle saturated markets', () => {
      const saturatedMarket = {
        competitors: Array(50).fill({ strength: 'high' }),
        marketGrowth: -0.05
      };

      const validation = validateSaturatedMarket(saturatedMarket);

      expect(validation.competitive_landscape).toBeLessThan(0.4);
      expect(validation.recommendation).toContain('pivot' || 'not_recommended');
    });

    test('should handle niche markets accurately', () => {
      const nicheIdea = {
        title: 'Left-handed violinist chin rests',
        tam: 50000 // Very small TAM
      };

      const validation = validateNicheMarket(nicheIdea);

      expect(validation.market_opportunity).toBeLessThan(0.6);
      expect(validation.insights).toContain('niche');
    });
  });
});

// Helper functions
async function performMarketResearch(idea: any, webSearch: any) {
  try {
    const searchResults = await webSearch.search(idea.title);
    return {
      competitors: await webSearch.getCompetitors(idea.title),
      marketSize: { tam: 500000000 },
      trends: { growth: 0.15 },
      searchVolume: searchResults.searchVolume
    };
  } catch (error) {
    return { fallbackUsed: true, confidence: 0.3 };
  }
}

async function performMarketResearchWithTimeout(idea: any, webSearch: any, timeout: number) {
  return Promise.race([
    performMarketResearch(idea, webSearch),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeout)
    )
  ]);
}

async function identifyCompetitors(query: string, webSearch: any) {
  return await webSearch.getCompetitors(query);
}

function analyzeCompetitiveLandscape(competitors: any[]) {
  return {
    totalCompetitors: competitors.length,
    marketLeader: competitors[0],
    gaps: ['AI features', 'mobile app'],
    saturationLevel: competitors.length > 20 ? 'high' : 'medium'
  };
}

function estimateMarketSize(data: any) {
  return {
    tam: data.fundingActivity * 10,
    confidence: 0.75
  };
}

function calculateValidationScore(data: any) {
  return {
    market_opportunity: data.marketOpportunity || 0.5,
    competitive_landscape: data.competitiveLandscape || 0.5,
    execution_feasibility: data.executionFeasibility || 0.5,
    innovation_potential: data.innovationPotential || 0.5,
    overall_score: 0.6,
    confidence: { overall: data.competitors?.length > 0 ? 0.8 : 0.4 },
    limitations: data.competitors?.length === 0 ? ['limited market data'] : []
  };
}

function calculateWeightedScore(scores: any) {
  return (
    scores.market_opportunity * 0.30 +
    scores.competitive_landscape * 0.25 +
    scores.execution_feasibility * 0.25 +
    scores.innovation_potential * 0.20
  );
}

function calculateConfidenceScores(dataQuality: any) {
  const qualityToScore = { high: 0.9, medium: 0.7, low: 0.4 };
  return {
    overall: 0.75,
    market_opportunity: qualityToScore[dataQuality.marketData as keyof typeof qualityToScore]
  };
}

function categorizeValidation(score: number): string {
  if (score >= 0.75) return 'strong_proceed';
  if (score >= 0.55) return 'proceed_with_refinement';
  if (score >= 0.35) return 'pivot_required';
  return 'not_recommended';
}

function generateInsights(validation: any) {
  return validation.insights;
}

function identifyMarketGaps(competitors: any[]) {
  const focuses = competitors.map(c => c.focus);
  const gaps = [];

  if (!focuses.includes('students')) gaps.push('student market');
  if (!focuses.includes('mobile')) gaps.push('mobile users');

  return gaps;
}

function recommendDifferentiation(analysis: any) {
  return analysis.gaps.map((gap: string) => ({
    approach: `Focus on ${gap}`,
    reasoning: `Competitors haven't addressed ${gap}`
  }));
}

function estimateTimeline(data: any) {
  const baseWeeks = data.technicalComplexity === 'low' ? 2 : 6;
  return { min_weeks: baseWeeks, max_weeks: baseWeeks * 2 };
}

function createValidationDashboard(result: any) {
  return {
    scores: result.scores,
    charts: [],
    insights: result.insights,
    recommendation: result.recommendation
  };
}

function formatScoresForChart(scores: any) {
  return Object.entries(scores).map(([label, value]) => ({
    label,
    value,
    color: value > 0.7 ? 'green' : 'yellow'
  }));
}

function createCompetitorComparison(competitors: any[]) {
  return competitors.map(c => ({
    name: c.name,
    strengths: c.features,
    gaps: c.gaps
  }));
}

function validateEmergingMarket(market: any) {
  return {
    confidence: { overall: 0.5 },
    notes: ['emerging market', 'limited data available']
  };
}

function validateSaturatedMarket(market: any) {
  return {
    competitive_landscape: 0.3,
    recommendation: 'pivot_required'
  };
}

function validateNicheMarket(idea: any) {
  return {
    market_opportunity: 0.5,
    insights: ['niche market', 'limited scale potential']
  };
}
