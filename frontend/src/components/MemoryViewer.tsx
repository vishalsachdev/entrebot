import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { memoryService } from '../services/database';
import type { DbMemory, CreateMemoryForm } from '../types/database';

interface MemoryViewerProps {
  sessionId: string;
  onMemoryChange?: (memories: DbMemory[]) => void;
}

export default function MemoryViewer({ sessionId, onMemoryChange }: MemoryViewerProps) {
  const [memories, setMemories] = useState<DbMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMemory, setNewMemory] = useState<CreateMemoryForm>({ key: '', value: '' });
  const [editValue, setEditValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMemories();
  }, [sessionId]);

  const loadMemories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await memoryService.getMemories(sessionId);
      setMemories(data);
      onMemoryChange?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemory.key.trim() || !newMemory.value.trim()) return;

    try {
      setError(null);
      const created = await memoryService.createMemory(sessionId, newMemory);
      setMemories(prev => [...prev, created]);
      setNewMemory({ key: '', value: '' });
      setIsAdding(false);
      onMemoryChange?.([...memories, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create memory');
    }
  };

  const handleUpdateMemory = async (memoryId: string) => {
    if (!editValue.trim()) return;

    try {
      setError(null);
      const updated = await memoryService.updateMemory(memoryId, { value: editValue });
      setMemories(prev => prev.map(m => (m.id === memoryId ? updated : m)));
      setEditingId(null);
      setEditValue('');
      onMemoryChange?.(memories.map(m => (m.id === memoryId ? updated : m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update memory');
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    try {
      setError(null);
      await memoryService.deleteMemory(memoryId);
      const updated = memories.filter(m => m.id !== memoryId);
      setMemories(updated);
      onMemoryChange?.(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete memory');
    }
  };

  const startEditing = (memory: DbMemory) => {
    setEditingId(memory.id);
    setEditValue(memory.value);
    setError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue('');
    setError(null);
  };

  const parseValue = (value: string) => {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  const isJsonValue = (value: string) => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  };

  const filteredMemories = memories.filter(
    m =>
      m.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-neutral-600">Loading memories...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Memory Store</h2>
          <p className="text-sm text-neutral-500 mt-1">
            {memories.length} {memories.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="btn-primary"
        >
          {isAdding ? 'Cancel' : '+ Add Memory'}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="text-red-700 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Add Memory Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddMemory}
            className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200"
          >
            <h3 className="font-semibold text-neutral-900 mb-3">Add New Memory</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Key
                </label>
                <input
                  type="text"
                  value={newMemory.key}
                  onChange={e => setNewMemory({ ...newMemory, key: e.target.value })}
                  className="input"
                  placeholder="e.g., user_preference, api_token"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Value (JSON or text)
                </label>
                <textarea
                  value={newMemory.value}
                  onChange={e => setNewMemory({ ...newMemory, value: e.target.value })}
                  className="input min-h-[100px]"
                  placeholder='e.g., {"theme": "dark"} or just plain text'
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">
                  Add Memory
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setNewMemory({ key: '', value: '' });
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Search */}
      {memories.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input"
            placeholder="Search memories by key or value..."
          />
        </div>
      )}

      {/* Memories List */}
      {filteredMemories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🧠</div>
          <h3 className="text-lg font-semibold text-neutral-700 mb-2">
            {searchTerm ? 'No matching memories' : 'No memories yet'}
          </h3>
          <p className="text-neutral-500 text-sm mb-6">
            {searchTerm
              ? 'Try a different search term'
              : 'Add your first memory to store session data'}
          </p>
          {!searchTerm && !isAdding && (
            <button onClick={() => setIsAdding(true)} className="btn-primary">
              Add First Memory
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredMemories.map((memory, index) => (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.03 }}
                className="p-4 rounded-lg border border-neutral-200 bg-white hover:border-neutral-300 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-neutral-900 font-mono text-sm break-all">
                      {memory.key}
                    </h4>
                    <p className="text-xs text-neutral-500 mt-1">
                      Updated {new Date(memory.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    {editingId !== memory.id && (
                      <>
                        <button
                          onClick={() => startEditing(memory)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteMemory(memory.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {editingId === memory.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="input min-h-[100px] w-full"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateMemory(memory.id)}
                        className="btn-primary text-sm flex-1"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="btn-secondary text-sm flex-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    {isJsonValue(memory.value) ? (
                      <pre className="text-xs bg-neutral-900 text-neutral-100 p-3 rounded overflow-x-auto">
                        {JSON.stringify(parseValue(memory.value), null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm text-neutral-700 whitespace-pre-wrap break-words bg-neutral-50 p-3 rounded">
                        {memory.value}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
