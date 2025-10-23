/**
 * Base Agent Class
 * All specialized agents inherit from this base
 */

import { sendMessage, streamMessage } from '../services/openai.js';
import { memoryQueries } from '../database/queries.js';
import { logger } from '../config/logger.js';

export class BaseAgent {
  constructor(name, systemPrompt) {
    this.name = name;
    this.systemPrompt = systemPrompt;
  }

  /**
   * Send message without streaming
   */
  async send(messages, options = {}) {
    try {
      const result = await sendMessage(
        messages,
        this.systemPrompt,
        options
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      // GPT-5 response format
      return result.response.choices[0].message.content;
    } catch (error) {
      logger.error(`${this.name} agent error:`, error);
      throw error;
    }
  }

  /**
   * Send message with streaming
   */
  async stream(messages, onChunk, options = {}) {
    try {
      const result = await streamMessage(
        messages,
        this.systemPrompt,
        onChunk,
        options
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.text;
    } catch (error) {
      logger.error(`${this.name} agent streaming error:`, error);
      throw error;
    }
  }

  /**
   * Get memory value
   */
  async getMemory(sessionId, key) {
    const result = await memoryQueries.get(sessionId, key);
    return result.success ? result.value : null;
  }

  /**
   * Set memory value
   */
  async setMemory(sessionId, key, value) {
    return await memoryQueries.set(sessionId, key, value);
  }

  /**
   * Get all memory for session
   */
  async getAllMemory(sessionId) {
    const result = await memoryQueries.getAll(sessionId);
    return result.success ? result.memory : {};
  }
}

export default BaseAgent;
