import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserProfile,
  ConversationView,
  SessionList,
  MemoryViewer,
} from '../components';
import type { DbSession } from '../types/database';

/**
 * Demo page showing all database components working together
 * This demonstrates the full integration of all 4 database tables
 */
export default function DatabaseDemo() {
  // In a real app, this would come from auth context
  const [userId] = useState('demo-user-123');
  const [selectedSession, setSelectedSession] = useState<DbSession | null>(null);
  const [activeTab, setActiveTab] = useState<'sessions' | 'conversation' | 'memory'>('sessions');

  const handleSessionSelect = (session: DbSession) => {
    setSelectedSession(session);
    setActiveTab('conversation');
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            Database Components Demo
          </h1>
          <p className="text-neutral-600">
            Interact with all 4 database tables: Users, Sessions, Conversations, and Memory
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Profile */}
          <div className="lg:col-span-1">
            <UserProfile
              userId={userId}
              onUpdate={(user) => {
                console.log('User updated:', user);
              }}
            />
          </div>

          {/* Right Column - Sessions & Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="card p-0 overflow-hidden">
              <div className="flex border-b border-neutral-200">
                <button
                  onClick={() => setActiveTab('sessions')}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                    activeTab === 'sessions'
                      ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  Sessions
                </button>
                <button
                  onClick={() => setActiveTab('conversation')}
                  disabled={!selectedSession}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                    activeTab === 'conversation'
                      ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600'
                      : 'text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  Conversation
                  {selectedSession && (
                    <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                      Active
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('memory')}
                  disabled={!selectedSession}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                    activeTab === 'memory'
                      ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600'
                      : 'text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  Memory
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === 'sessions' && (
                <SessionList
                  userId={userId}
                  onSessionSelect={handleSessionSelect}
                  selectedSessionId={selectedSession?.id}
                />
              )}

              {activeTab === 'conversation' && selectedSession && (
                <ConversationView
                  sessionId={selectedSession.id}
                  onMessageSent={(message) => {
                    console.log('Message sent:', message);
                  }}
                />
              )}

              {activeTab === 'memory' && selectedSession && (
                <MemoryViewer
                  sessionId={selectedSession.id}
                  onMemoryChange={(memories) => {
                    console.log('Memories updated:', memories.length);
                  }}
                />
              )}

              {(activeTab === 'conversation' || activeTab === 'memory') && !selectedSession && (
                <div className="card">
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👈</div>
                    <h3 className="text-lg font-semibold text-neutral-700 mb-2">
                      Select a session first
                    </h3>
                    <p className="text-neutral-500 text-sm">
                      Choose a session from the Sessions tab to view its {activeTab}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 card bg-neutral-900 text-white"
        >
          <h3 className="text-lg font-semibold mb-3">Component Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-primary-400 mb-2">UserProfile</h4>
              <ul className="space-y-1 text-neutral-300">
                <li>• View user details</li>
                <li>• Edit profile inline</li>
                <li>• Form validation</li>
                <li>• Loading states</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-primary-400 mb-2">SessionList</h4>
              <ul className="space-y-1 text-neutral-300">
                <li>• Create new sessions</li>
                <li>• Select active session</li>
                <li>• Delete with confirm</li>
                <li>• Sorted by date</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-primary-400 mb-2">ConversationView</h4>
              <ul className="space-y-1 text-neutral-300">
                <li>• Chat interface</li>
                <li>• Send messages</li>
                <li>• Auto-scroll</li>
                <li>• Message styling</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-primary-400 mb-2">MemoryViewer</h4>
              <ul className="space-y-1 text-neutral-300">
                <li>• Add/edit/delete</li>
                <li>• JSON viewer</li>
                <li>• Search filter</li>
                <li>• Key-value pairs</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
