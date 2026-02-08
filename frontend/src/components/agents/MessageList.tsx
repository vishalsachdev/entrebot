import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  User as UserIcon,
  Pencil,
  Trash2,
  X,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Card, MarkdownRenderer, Button } from '../ui';
import { cn } from '../../utils/cn';
import type { Message, Agent } from '../../types';
import IdeaCardGrid from '../ideas/IdeaCardGrid';
import type { Idea } from '../ideas/IdeaCard';
import ValidationDashboard from '../validation/ValidationDashboard';
import type { ValidationDashboardProps } from '../validation/ValidationDashboard';

/**
 * Parse structured ideas from agent response text.
 * Matches patterns like:
 *   1. IdeaName - Short tagline
 *      How it solves your pain: ...
 *      Build with: Bolt.new + GPT-4 Vision API
 *      Business model: SaaS ($5/mo)
 *
 * Returns null if fewer than 2 ideas are parsed.
 */
function parseIdeasFromContent(content: string): Idea[] | null {
  // Split on numbered item boundaries: "1. ", "2. ", etc. at the start of a line
  const ideaBlocks = content
    .split(/(?=^\d+\.\s)/m)
    .filter(block => block.trim());

  const ideas: Idea[] = [];

  for (const block of ideaBlocks) {
    // Match "1. Name - Description" or "1. Name\n..."
    const headerMatch = block.match(/^(\d+)\.\s+(.+?)(?:\n|$)/);
    if (!headerMatch) continue;

    const id = parseInt(headerMatch[1], 10);
    const headerLine = headerMatch[2].trim();

    // Split name and tagline on " - " separator
    let name: string;
    let description: string;

    const dashIndex = headerLine.indexOf(' - ');
    if (dashIndex !== -1) {
      name = headerLine.substring(0, dashIndex).trim();
      description = headerLine.substring(dashIndex + 3).trim();
    } else {
      name = headerLine;
      description = '';
    }

    // Extract "How it solves..." line as extended description if present
    const solveMatch = block.match(/how it solves[^:]*:\s*(.+)/i);
    if (solveMatch) {
      description = description
        ? `${description}. ${solveMatch[1].trim()}`
        : solveMatch[1].trim();
    }

    // Extract tool/build-with info
    let tool: string | undefined;
    const toolMatch = block.match(/build with:\s*(.+)/i);
    if (toolMatch) {
      // Take the first tool name before any "+" or "," for the badge
      const rawTool = toolMatch[1].trim();
      const firstTool = rawTool.split(/[+,]/)[0].trim();
      tool = firstTool;
    }

    // Extract business model / concept type
    let conceptType: string | undefined;
    const modelMatch = block.match(/business model:\s*(.+)/i);
    if (modelMatch) {
      conceptType = modelMatch[1].trim();
    }

    // Extract differentiator if present
    let differentiator: string | undefined;
    const diffMatch = block.match(
      /(?:differentiator|what makes it different|unique angle)[^:]*:\s*(.+)/i
    );
    if (diffMatch) {
      differentiator = diffMatch[1].trim();
    }

    // Only include if we have at minimum a name
    if (name) {
      ideas.push({
        id,
        name,
        description: description || name,
        tool,
        conceptType,
        differentiator,
      });
    }
  }

  // Return null if fewer than 2 ideas found -- not a structured idea list
  return ideas.length >= 2 ? ideas : null;
}

/**
 * Parse validation scores from agent response text.
 * Matches patterns like:
 *   1. FEASIBILITY: 7/10
 *   2. MARKET DEMAND: 6/10
 *   3. COMPETITION: 8/10
 *   4. DIFFERENTIATION: 7/10
 *
 * All 4 scores are required; returns null otherwise.
 * Also extracts riskiestAssumption and validationTest if present.
 */
function parseValidationFromContent(
  content: string
): ValidationDashboardProps | null {
  // Match score patterns -- flexible with numbering, casing, colons, and whitespace
  const scorePattern = (label: string): number | null => {
    const regex = new RegExp(`${label}[:\\s]+?(\\d{1,2})\\s*/\\s*10`, 'i');
    const match = content.match(regex);
    if (match) {
      const value = parseInt(match[1], 10);
      if (value >= 0 && value <= 10) return value;
    }
    return null;
  };

  const feasibility = scorePattern('feasibility');
  const marketDemand = scorePattern('market\\s*demand');
  const competition = scorePattern('competition');
  const differentiation = scorePattern('differentiation');

  // All 4 scores are required
  if (
    feasibility === null ||
    marketDemand === null ||
    competition === null ||
    differentiation === null
  ) {
    return null;
  }

  // Extract riskiest assumption
  let riskiestAssumption: string | undefined;
  const riskMatch = content.match(
    /(?:riskiest|biggest|key)\s*assumption[^:]*:\s*(.+?)(?:\n\n|\n\d+|$)/is
  );
  if (riskMatch) {
    riskiestAssumption = riskMatch[1].trim();
  }

  // Extract validation test suggestion
  let validationTest: string | undefined;
  const testMatch = content.match(
    /(?:\d+-hour\s*)?validation\s*test[^:]*:\s*(.+?)(?:\n\n|$)/is
  );
  if (testMatch) {
    validationTest = testMatch[1].trim();
  }

  // Determine recommendation based on average score
  const avg = (feasibility + marketDemand + competition + differentiation) / 4;
  let recommendation: 'proceed' | 'pivot' | 'explore_different' | undefined;
  if (avg >= 7) recommendation = 'proceed';
  else if (avg >= 4.5) recommendation = 'pivot';
  else recommendation = 'explore_different';

  return {
    feasibility,
    marketDemand,
    competition,
    differentiation,
    riskiestAssumption,
    validationTest,
    recommendation,
  };
}

interface MessageListProps {
  messages: Message[];
  currentAgent: Agent | null;
  streamingMessageId: string | null;
  isTyping: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onSelectIdea?: (ideaNumber: number) => void;
}

// Transition message component for agent switches
const TransitionMessage = ({ message }: { message: Message }) => {
  const toAgentName = message.metadata?.toAgent || 'new agent';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center py-2"
    >
      <div className="bg-neutral-100 border border-neutral-200 rounded-full px-4 py-2 flex items-center gap-2 text-sm text-neutral-600">
        <RefreshCw className="h-3.5 w-3.5" />
        <span>{message.content || `Switched to ${toAgentName}`}</span>
      </div>
    </motion.div>
  );
};

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  (
    {
      messages,
      currentAgent,
      streamingMessageId,
      isTyping,
      onEditMessage,
      onDeleteMessage,
      onSelectIdea,
    },
    ref
  ) => {
    const [editingMessageId, setEditingMessageId] = useState<string | null>(
      null
    );
    const [editContent, setEditContent] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(
      null
    );

    const handleStartEdit = (message: Message) => {
      setEditingMessageId(message.id);
      setEditContent(message.content);
    };

    const handleCancelEdit = () => {
      setEditingMessageId(null);
      setEditContent('');
    };

    const handleSaveEdit = (messageId: string) => {
      if (editContent.trim() && onEditMessage) {
        onEditMessage(messageId, editContent.trim());
      }
      setEditingMessageId(null);
      setEditContent('');
    };

    const handleDeleteClick = (messageId: string) => {
      setDeleteConfirmId(messageId);
    };

    const handleConfirmDelete = (messageId: string) => {
      if (onDeleteMessage) {
        onDeleteMessage(messageId);
      }
      setDeleteConfirmId(null);
    };

    const handleCancelDelete = () => {
      setDeleteConfirmId(null);
    };

    // Check if a message can be edited (user messages only, not currently streaming)
    const canEditMessage = (message: Message) => {
      return (
        message.role === 'user' &&
        message.id !== streamingMessageId &&
        message.status !== 'sending'
      );
    };

    // Check if a message can be deleted
    const canDeleteMessage = (message: Message) => {
      return (
        message.role === 'user' &&
        message.id !== streamingMessageId &&
        message.status !== 'sending'
      );
    };

    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
        {/* Empty state with agent */}
        {messages.length === 0 && currentAgent && (
          <div className="text-center py-12">
            <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="h-8 w-8 text-primary-700" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Start a conversation with {currentAgent.name}
            </h3>
            <p className="text-neutral-600 max-w-md mx-auto">
              {currentAgent.description}
            </p>
          </div>
        )}

        {/* Empty state without agent */}
        {!currentAgent && (
          <div className="text-center py-12">
            <p className="text-neutral-600">
              Select an agent to start chatting
            </p>
          </div>
        )}

        {/* Messages */}
        <AnimatePresence>
          {messages.map((message, index) => {
            // Render transition messages differently
            if (message.metadata?.isTransition) {
              return <TransitionMessage key={message.id} message={message} />;
            }

            // Render system messages as centered notices
            if (message.role === 'system' && !message.metadata?.isTransition) {
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center py-2"
                >
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800 max-w-md text-center">
                    {message.content}
                  </div>
                </motion.div>
              );
            }

            const isEditing = editingMessageId === message.id;
            const isDeleteConfirm = deleteConfirmId === message.id;
            const isHovered = hoveredMessageId === message.id;
            const showActions =
              canEditMessage(message) || canDeleteMessage(message);
            // Check if this message has been responded to (next message is from assistant)
            const hasResponse =
              index < messages.length - 1 &&
              messages[index + 1]?.role === 'assistant';

            // Pre-compute rich content for assistant messages (only when not streaming)
            const isStreaming = message.id === streamingMessageId;
            const parsedIdeas =
              message.role === 'assistant' && !isStreaming
                ? parseIdeasFromContent(message.content)
                : null;
            const parsedValidation =
              message.role === 'assistant' && !isStreaming && !parsedIdeas
                ? parseValidationFromContent(message.content)
                : null;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  'group',
                  message.role === 'user' ? 'flex gap-3 justify-end' : ''
                )}
                onMouseEnter={() => setHoveredMessageId(message.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                {/* Assistant messages: use a flex column wrapper so rich content can go full-width below */}
                {message.role === 'assistant' ? (
                  <div className="flex flex-col gap-2">
                    {/* Message row with avatar and card */}
                    <div className="flex gap-3 justify-start">
                      <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary-700" />
                      </div>

                      <Card
                        className={cn('max-w-[70%]', 'bg-white')}
                        padding="sm"
                      >
                        <div className="text-sm text-neutral-900">
                          <MarkdownRenderer content={message.content} />
                          {/* Show cursor while streaming this message */}
                          {isStreaming && (
                            <span className="inline-block w-2 h-4 bg-primary-500 animate-pulse ml-0.5" />
                          )}
                        </div>
                        <p className="text-xs mt-1 text-neutral-500">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {message.isEdited && (
                            <span className="ml-1">(edited)</span>
                          )}
                        </p>
                      </Card>
                    </div>

                    {/* Rich idea cards - rendered full width below the message */}
                    {parsedIdeas && (
                      <div className="w-full pl-11">
                        <IdeaCardGrid
                          ideas={parsedIdeas}
                          onSelectIdea={onSelectIdea}
                        />
                      </div>
                    )}

                    {/* Validation dashboard - rendered full width below the message */}
                    {parsedValidation && (
                      <div className="w-full pl-11">
                        <ValidationDashboard {...parsedValidation} />
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Delete confirmation dialog */}
                    {isDeleteConfirm && (
                      <div className="flex items-center gap-2 mr-2">
                        <span className="text-xs text-neutral-600">
                          Delete?
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleConfirmDelete(message.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Confirm delete"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelDelete}
                          className="h-6 w-6 p-0 text-neutral-600 hover:text-neutral-700"
                          title="Cancel"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {/* Action buttons for user messages (shown on hover) */}
                    {showActions && !isEditing && !isDeleteConfirm && (
                      <div
                        className={cn(
                          'flex items-center gap-1 transition-opacity',
                          isHovered ? 'opacity-100' : 'opacity-0'
                        )}
                      >
                        {canEditMessage(message) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEdit(message)}
                            className="h-6 w-6 p-0 text-neutral-500 hover:text-neutral-700"
                            title={
                              hasResponse
                                ? 'Edit message (will not regenerate response)'
                                : 'Edit message'
                            }
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                        {canDeleteMessage(message) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(message.id)}
                            className="h-6 w-6 p-0 text-neutral-500 hover:text-red-600"
                            title="Delete message"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}

                    <Card
                      className={cn(
                        'max-w-[70%]',
                        'bg-primary-600 text-white border-primary-600',
                        isEditing && 'bg-primary-50 border-primary-300'
                      )}
                      padding="sm"
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            className="w-full min-h-[60px] p-2 text-sm text-neutral-900 border border-neutral-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEdit}
                              className="h-7 px-2 text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(message.id)}
                              disabled={!editContent.trim()}
                              className="h-7 px-2 text-xs"
                            >
                              Save
                            </Button>
                          </div>
                          {hasResponse && (
                            <p className="text-xs text-amber-600">
                              Note: Editing won&apos;t regenerate the
                              assistant&apos;s response
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap text-white">
                          {message.content}
                        </p>
                      )}
                      {!isEditing && (
                        <p className="text-xs mt-1 text-primary-100">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {message.isEdited && (
                            <span className="ml-1">(edited)</span>
                          )}
                        </p>
                      )}
                    </Card>

                    <div className="h-8 w-8 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserIcon className="h-4 w-4 text-neutral-700" />
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator - only when waiting for first chunk */}
        {isTyping && !streamingMessageId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-primary-700" />
            </div>
            <Card className="bg-white" padding="sm">
              <div className="flex gap-1">
                <span className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce" />
                <span
                  className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <span
                  className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </Card>
          </motion.div>
        )}

        {/* Scroll anchor */}
        <div ref={ref} />
      </div>
    );
  }
);

MessageList.displayName = 'MessageList';

export default MessageList;
