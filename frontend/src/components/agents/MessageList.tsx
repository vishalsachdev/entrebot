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

interface MessageListProps {
  messages: Message[];
  currentAgent: Agent | null;
  streamingMessageId: string | null;
  isTyping: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
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

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  'flex gap-3 group',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
                onMouseEnter={() => setHoveredMessageId(message.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                {message.role === 'assistant' && (
                  <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary-700" />
                  </div>
                )}

                {/* Delete confirmation dialog */}
                {isDeleteConfirm && (
                  <div className="flex items-center gap-2 mr-2">
                    <span className="text-xs text-neutral-600">Delete?</span>
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
                {message.role === 'user' &&
                  showActions &&
                  !isEditing &&
                  !isDeleteConfirm && (
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
                    message.role === 'user'
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white',
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
                          Note: Editing won't regenerate the assistant's
                          response
                        </p>
                      )}
                    </div>
                  ) : message.role === 'assistant' ? (
                    <div className="text-sm text-neutral-900">
                      <MarkdownRenderer content={message.content} />
                      {/* Show cursor while streaming this message */}
                      {message.id === streamingMessageId && (
                        <span className="inline-block w-2 h-4 bg-primary-500 animate-pulse ml-0.5" />
                      )}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap text-white">
                      {message.content}
                    </p>
                  )}
                  {!isEditing && (
                    <p
                      className={cn(
                        'text-xs mt-1',
                        message.role === 'user'
                          ? 'text-primary-100'
                          : 'text-neutral-500'
                      )}
                    >
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

                {message.role === 'user' && (
                  <div className="h-8 w-8 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserIcon className="h-4 w-4 text-neutral-700" />
                  </div>
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
