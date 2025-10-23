/**
 * Anthropic API Client
 * Handles communication with Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

let anthropicClient = null;

/**
 * Initialize Anthropic client
 */
export const initializeAnthropic = () => {
  try {
    anthropicClient = new Anthropic({
      apiKey: config.anthropic.apiKey
    });

    logger.info('✅ Anthropic client initialized');
    return anthropicClient;
  } catch (error) {
    logger.error('Failed to initialize Anthropic client:', error);
    throw error;
  }
};

/**
 * Get Anthropic client instance
 */
export const getAnthropic = () => {
  if (!anthropicClient) {
    return initializeAnthropic();
  }
  return anthropicClient;
};

/**
 * Send message to Claude with streaming support
 */
export const sendMessage = async (messages, systemPrompt, options = {}) => {
  try {
    const client = getAnthropic();

    const response = await client.messages.create({
      model: options.model || config.anthropic.model,
      max_tokens: options.maxTokens || config.anthropic.maxTokens,
      system: systemPrompt,
      messages: messages,
      stream: options.stream || false
    });

    return { success: true, response };
  } catch (error) {
    logger.error('Error sending message to Claude:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Stream message from Claude
 */
export const streamMessage = async (messages, systemPrompt, onChunk, options = {}) => {
  try {
    const client = getAnthropic();

    const stream = await client.messages.create({
      model: options.model || config.anthropic.model,
      max_tokens: options.maxTokens || config.anthropic.maxTokens,
      system: systemPrompt,
      messages: messages,
      stream: true
    });

    let fullText = '';

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const text = chunk.delta.text;
        fullText += text;
        if (onChunk) {
          await onChunk(text);
        }
      }
    }

    return { success: true, text: fullText };
  } catch (error) {
    logger.error('Error streaming message from Claude:', error);
    return { success: false, error: error.message };
  }
};

export default {
  initializeAnthropic,
  getAnthropic,
  sendMessage,
  streamMessage
};
