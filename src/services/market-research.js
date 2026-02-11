/**
 * Market Research Service
 * Optional external research providers used by Validator for evidence-backed analysis.
 */

import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

const normalizeFinding = finding => ({
  title: finding.title || 'Untitled',
  url: finding.url || '',
  snippet: finding.snippet || ''
});

const trimFindings = findings =>
  findings.filter(f => f.url).slice(0, config.marketResearch.maxResults);

async function searchWithTavily(query) {
  const apiKey = config.marketResearch.tavilyApiKey;
  if (!apiKey) {
    return { success: false, error: 'Tavily API key not configured' };
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: config.marketResearch.maxResults,
      search_depth: 'basic',
      include_answer: false,
      include_raw_content: false
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Tavily error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const findings = trimFindings(
    (data.results || []).map(item =>
      normalizeFinding({
        title: item.title,
        url: item.url,
        snippet: item.content
      })
    )
  );

  return {
    success: true,
    provider: 'tavily',
    findings,
    citations: findings.map(f => f.url)
  };
}

async function searchWithSerpApi(query) {
  const apiKey = config.marketResearch.serpApiKey;
  if (!apiKey) {
    return { success: false, error: 'SerpAPI key not configured' };
  }

  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('q', query);
  url.searchParams.set('api_key', apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SerpAPI error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const findings = trimFindings(
    (data.organic_results || []).map(item =>
      normalizeFinding({
        title: item.title,
        url: item.link,
        snippet: item.snippet
      })
    )
  );

  return {
    success: true,
    provider: 'serpapi',
    findings,
    citations: findings.map(f => f.url)
  };
}

function pickProvider() {
  const explicit = (config.marketResearch.provider || '').toLowerCase();
  if (explicit === 'tavily') {
    return 'tavily';
  }
  if (explicit === 'serpapi') {
    return 'serpapi';
  }

  if (config.marketResearch.tavilyApiKey) {
    return 'tavily';
  }
  if (config.marketResearch.serpApiKey) {
    return 'serpapi';
  }
  return null;
}

export async function performMarketResearch(query) {
  const provider = pickProvider();
  if (!provider) {
    return {
      success: false,
      provider: 'none',
      findings: [],
      citations: [],
      error: 'No market research provider configured'
    };
  }

  try {
    if (provider === 'tavily') {
      return await searchWithTavily(query);
    }
    return await searchWithSerpApi(query);
  } catch (error) {
    logger.warn(`Market research failed (${provider}): ${error.message}`);
    return {
      success: false,
      provider,
      findings: [],
      citations: [],
      error: error.message
    };
  }
}

export default {
  performMarketResearch
};
