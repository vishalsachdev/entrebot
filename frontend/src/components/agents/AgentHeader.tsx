import { Bot } from 'lucide-react';
import type { Agent, Message } from '../../types';

interface AgentHeaderProps {
  agent: Agent;
  messages: Message[];
  onCopyLog: () => void;
  onNewChat: () => void;
}

export const AgentHeader = ({
  agent,
  messages,
  onCopyLog,
  onNewChat,
}: AgentHeaderProps) => {
  const handleCopyLog = () => {
    const log = messages
      .map(m => `[${m.role === 'user' ? 'USER' : 'BOT'}]: ${m.content}`)
      .join('\n\n');
    navigator.clipboard.writeText(log);
    onCopyLog();
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
        <button
          onClick={handleCopyLog}
          className="text-xs px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
        >
          Copy Log
        </button>
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
