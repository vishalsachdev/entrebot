/**
 * OpenAI API Client
 * Handles communication with GPT-5 API
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
 * Send message to GPT-5 with streaming support
 */
export const sendMessage = async (messages, systemPrompt, options = {}) => {
  try {
    const client = getOpenAI();

    // Combine system prompt with messages
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const response = await client.chat.completions.create({
      model: options.model || config.openai.model,
      messages: fullMessages,
      max_tokens: options.maxTokens || config.openai.maxTokens,
      temperature: options.temperature || 0.7,
      stream: options.stream || false
    });

    return { success: true, response };
  } catch (error) {
    logger.error('Error sending message to GPT-5:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Stream message from GPT-5
 */
export const streamMessage = async (messages, systemPrompt, onChunk, options = {}) => {
  try {
    const client = getOpenAI();

    // Combine system prompt with messages
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const stream = await client.chat.completions.create({
      model: options.model || config.openai.model,
      messages: fullMessages,
      max_tokens: options.maxTokens || config.openai.maxTokens,
      temperature: options.temperature || 0.7,
      stream: true
    });

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
    logger.error('Error streaming message from GPT-5:', error);
    return { success: false, error: error.message };
  }
};

export default {
  initializeOpenAI,
  getOpenAI,
  sendMessage,
  streamMessage
};
