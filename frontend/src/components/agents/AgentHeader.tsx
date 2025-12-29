import { useState, useRef, useEffect } from 'react';
import { Bot, Copy, FileJson, ChevronDown } from 'lucide-react';
import type { Agent, Message } from '../../types';

export type CopyFormat = 'text' | 'json';

interface AgentHeaderProps {
  agent: Agent;
  messages: Message[];
  sessionId?: string | null;
  onCopyLog: (format: CopyFormat) => void;
  onNewChat: () => void;
}

/**
 * Formats messages into a readable text log.
 * Format:
 * === VentureBot Chat Log ===
 * Session: [session-id]
 * Exported: [timestamp]
 *
 * [HH:MM] [Agent Name]: message content
 */
const formatMessagesAsText = (
  messages: Message[],
  agentName: string,
  sessionId?: string | null
): string => {
  const now = new Date();
  const exportTimestamp = now.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const header = [
    '=== VentureBot Chat Log ===',
    `Session: ${sessionId || 'unknown'}`,
    `Exported: ${exportTimestamp}`,
    '',
    '---',
    '',
  ].join('\n');

  const messageLog = messages
    .map(msg => {
      const time = new Date(msg.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const sender = msg.role === 'user' ? 'You' : agentName;
      return `[${time}] ${sender}:\n${msg.content}`;
    })
    .join('\n\n');

  return header + messageLog;
};

/**
 * Formats messages as JSON for structured export.
 */
const formatMessagesAsJson = (
  messages: Message[],
  agentName: string,
  sessionId?: string | null
): string => {
  const exportData = {
    metadata: {
      source: 'VentureBot',
      version: '1.0',
      sessionId: sessionId || null,
      agentName,
      exportedAt: new Date().toISOString(),
      messageCount: messages.length,
    },
    messages: messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      agentId: msg.agentId,
      status: msg.status,
      metadata: msg.metadata,
    })),
  };

  return JSON.stringify(exportData, null, 2);
};

export const AgentHeader = ({
  agent,
  messages,
  sessionId,
  onCopyLog,
  onNewChat,
}: AgentHeaderProps) => {
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowFormatMenu(false);
      }
    };

    if (showFormatMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFormatMenu]);

  const handleCopyFormat = async (format: CopyFormat) => {
    const formattedContent =
      format === 'json'
        ? formatMessagesAsJson(messages, agent.name, sessionId)
        : formatMessagesAsText(messages, agent.name, sessionId);

    try {
      await navigator.clipboard.writeText(formattedContent);
      onCopyLog(format);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = formattedContent;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      onCopyLog(format);
    }

    setShowFormatMenu(false);
  };

  return (
    <div className="border-b border-neutral-200 p-4 bg-white">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary-700" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-neutral-900">{agent.name}</h3>
          <p className="text-sm text-neutral-600">{agent.personality.tone}</p>
        </div>

        {/* Copy Log Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowFormatMenu(!showFormatMenu)}
            className="text-xs px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors flex items-center gap-1.5"
            title="Copy chat log to clipboard"
            disabled={messages.length === 0}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy Log
            <ChevronDown className="h-3 w-3" />
          </button>

          {showFormatMenu && messages.length > 0 && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-neutral-200 py-1 z-10">
              <button
                onClick={() => handleCopyFormat('text')}
                className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
              >
                <Copy className="h-4 w-4 text-neutral-500" />
                <div>
                  <span className="font-medium">Plain Text</span>
                  <p className="text-xs text-neutral-500">
                    Readable format with timestamps
                  </p>
                </div>
              </button>
              <button
                onClick={() => handleCopyFormat('json')}
                className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
              >
                <FileJson className="h-4 w-4 text-neutral-500" />
                <div>
                  <span className="font-medium">JSON</span>
                  <p className="text-xs text-neutral-500">
                    Structured data with metadata
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onNewChat}
          className="text-xs px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
        >
          New Chat
        </button>
      </div>
    </div>
  );
};

export default AgentHeader;
