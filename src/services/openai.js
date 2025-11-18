/**
 * OpenAI API Client
 * Handles communication with OpenAI API
 */

import OpenAI from 'openai';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

let openaiClient = null;

/**
 * Initialize OpenAI client
 */
export const initializeOpenAI = () => {
  try {
    openaiClient = new OpenAI({
      apiKey: config.openai.apiKey
    });

    logger.info('✅ OpenAI client initialized');
    return openaiClient;
  } catch (error) {
    logger.error('Failed to initialize OpenAI client:', error);
    throw error;
  }
};

/**
 * Get OpenAI client instance
 */
export const getOpenAI = () => {
  if (!openaiClient) {
    return initializeOpenAI();
  }
  return openaiClient;
};

/**
 * Send message to OpenAI API with streaming support
 */
export const sendMessage = async (messages, systemPrompt, options = {}) => {
  try {
    const client = getOpenAI();

    // Combine system prompt with messages
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const model = options.model || config.openai.model;
    const makePayload = (useMaxCompletion, tempMode = 'custom') => ({
      model,
      messages: fullMessages,
      ...(tempMode === 'custom' ? { temperature: options.temperature ?? 0.7 } : {}),
      stream: options.stream || false,
      ...(useMaxCompletion
        ? { max_completion_tokens: options.maxTokens || config.openai.maxTokens }
        : { max_tokens: options.maxTokens || config.openai.maxTokens })
    });

    // First attempt with max_tokens; if API rejects, retry with max_completion_tokens
    let response;
    try {
      response = await client.chat.completions.create(makePayload(false, 'custom'));
    } catch (e) {
      const msg = String(e?.message || e);
      try {
        if (/max_tokens(.+?)not supported|Use 'max_completion_tokens'/i.test(msg)) {
          response = await client.chat.completions.create(makePayload(true, 'custom'));
        } else if (/temperature(.+?)Only the default\s*\(\s*1\s*\)\s*value is supported/i.test(msg)) {
          // Retry with temperature omitted (defaults to 1) or explicitly 1
          response = await client.chat.completions.create(makePayload(false, 'omit'));
        } else {
          throw e;
        }
      } catch (e2) {
        const msg2 = String(e2?.message || e2);
        if (/temperature(.+?)Only the default\s*\(\s*1\s*\)\s*value is supported/i.test(msg2)) {
          // Final retry: with max_completion_tokens (if needed) and temperature omitted
          response = await client.chat.completions.create(makePayload(true, 'omit'));
        } else {
          throw e2;
        }
      }
    }

    return { success: true, response };
  } catch (error) {
    logger.error('Error sending message to OpenAI API:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Stream message from OpenAI API
 */
export const streamMessage = async (messages, systemPrompt, onChunk, options = {}) => {
  try {
    const client = getOpenAI();

    // Combine system prompt with messages
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const model = options.model || config.openai.model;
    const makePayload = (useMaxCompletion, tempMode = 'custom') => ({
      model,
      messages: fullMessages,
      ...(tempMode === 'custom' ? { temperature: options.temperature ?? 0.7 } : {}),
      stream: true,
      ...(useMaxCompletion
        ? { max_completion_tokens: options.maxTokens || config.openai.maxTokens }
        : { max_tokens: options.maxTokens || config.openai.maxTokens })
    });

    let stream;
    try {
      stream = await client.chat.completions.create(makePayload(false, 'custom'));
    } catch (e) {
      const msg = String(e?.message || e);
      try {
        if (/max_tokens(.+?)not supported|Use 'max_completion_tokens'/i.test(msg)) {
          stream = await client.chat.completions.create(makePayload(true, 'custom'));
        } else if (/temperature(.+?)Only the default\s*\(\s*1\s*\)\s*value is supported/i.test(msg)) {
          stream = await client.chat.completions.create(makePayload(false, 'omit'));
        } else {
          throw e;
        }
      } catch (e2) {
        const msg2 = String(e2?.message || e2);
        if (/temperature(.+?)Only the default\s*\(\s*1\s*\)\s*value is supported/i.test(msg2)) {
          stream = await client.chat.completions.create(makePayload(true, 'omit'));
        } else {
          throw e2;
        }
      }
    }

    let fullText = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullText += delta;
        if (onChunk) {
          await onChunk(delta);
        }
      }
    }

    return { success: true, text: fullText };
  } catch (error) {
    logger.error('Error streaming message from OpenAI API:', error);
    return { success: false, error: error.message };
  }
};

export default {
  initializeOpenAI,
  getOpenAI,
  sendMessage,
  streamMessage
};
