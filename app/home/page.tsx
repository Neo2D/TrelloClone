'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Plus, Settings, Trash2, Users, Camera, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Workspace {
  id: number;
  name: string;
  image_url?: string;
  owner_id: number;
}

interface Board {
  id: number;
  name: string;
  workspace_id: number;
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceImage, setWorkspaceImage] = useState('');
  const [boardName, setBoardName] = useState('');
  const [hoveredWorkspace, setHoveredWorkspace] = useState<number | null>(null);
  const [workspaceImageUrl, setWorkspaceImageUrl] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchWorkspaces();
    }
  }, [user]);

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch('/api/workspaces');
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBoards = async (workspaceId: number) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/boards`);
      if (response.ok) {
        const data = await response.json();
        setBoards(data);
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
    }
  };

  const handleWorkspaceClick = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    fetchBoards(workspace.id);
  };

  const createWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workspaceName,
          image_url: workspaceImage || null
        })
      });

      if (response.ok) {
        fetchWorkspaces();
        setShowCreateWorkspace(false);
        setWorkspaceName('');
        setWorkspaceImage('');
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
    }
  };

  const createBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspace) return;

    try {
      const response = await fetch(`/api/workspaces/${selectedWorkspace.id}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: boardName })
      });

      if (response.ok) {
        fetchBoards(selectedWorkspace.id);
        setShowCreateBoard(false);
        setBoardName('');
      }
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  const deleteWorkspace = async (workspaceId: number) => {
    if (!confirm('Are you sure you want to delete this workspace?')) return;

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchWorkspaces();
        if (selectedWorkspace?.id === workspaceId) {
          setSelectedWorkspace(null);
          setBoards([]);
        }
      }
    } catch (error) {
      console.error('Error deleting workspace:', error);
    }
  };

  const updateWorkspaceImage = async (workspaceId: number) => {
    if (!workspaceImageUrl.trim()) return;

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: workspaceImageUrl })
      });

      if (response.ok) {
        fetchWorkspaces();
        setWorkspaceImageUrl('');
        setHoveredWorkspace(null);
      }
    } catch (error) {
      console.error('Error updating workspace image:', error);
    }
  };

  const handleWorkspaceImageUpload = async (file: File, workspaceId: number) => {
    // For now, we'll just use a placeholder since we don't have file storage set up
    // In a real app, you would upload to cloud storage and get the URL
    const imageUrl = `https://via.placeholder.com/150x150/4F46E5/FFFFFF?text=${encodeURIComponent('WS')}`;
    
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl })
      });

      if (response.ok) {
        fetchWorkspaces();
        setHoveredWorkspace(null);
      }
    } catch (error) {
      console.error('Error updating workspace image:', error);
    }
  };

  if (authLoading || !user) {
    return (
      <Layout 
        user={user || undefined}
        children={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        }
      />
    );
  }

  return (
    <Layout 
      user={user}
      children={
        <div className="px-20 py-12">
        <div className="flex gap-12">
          {/* Workspaces Sidebar */}
          <div className="w-1/3 pt-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Workspaces</h2>
              <button
                onClick={() => setShowCreateWorkspace(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedWorkspace?.id === workspace.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => handleWorkspaceClick(workspace)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="relative group cursor-pointer"
                        onMouseEnter={() => setHoveredWorkspace(workspace.id)}
                        onMouseLeave={() => setHoveredWorkspace(null)}
                      >
                        {workspace.image_url ? (
                          <img
                            src={workspace.image_url}
                            alt={workspace.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                            <Users size={20} />
                          </div>
                        )}
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Camera size={16} {...({ className: "text-white" } as any)} />
                        </div>
                        
                        {/* Image Upload Options */}
                        {hoveredWorkspace === workspace.id && (
                          <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border p-3 z-10 w-64">
                            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Update Workspace Image</h4>
                            
                            {/* URL Upload */}
                            <div className="mb-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Image URL
                              </label>
                              <div className="flex space-x-2">
                                <input
                                  type="url"
                                  value={workspaceImageUrl}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWorkspaceImageUrl(e.target.value)}
                                  placeholder="Enter image URL..."
                                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                  onClick={() => updateWorkspaceImage(workspace.id)}
                                  disabled={!workspaceImageUrl.trim()}
                                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                            
                            {/* File Upload */}
                            <div className="border-t pt-2">
                              <button
                                onClick={() => document.getElementById(`workspace-file-${workspace.id}`)?.click()}
                                className="w-full flex items-center justify-center space-x-1 px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 text-xs"
                              >
                                <Upload size={12} />
                                <span>Upload from Computer</span>
                              </button>
                              <input
                                id={`workspace-file-${workspace.id}`}
                                type="file"
                                accept="image/*"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleWorkspaceImageUpload(file, workspace.id);
                                }}
                                className="hidden"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{workspace.name}</h3>
                        <p className="text-sm text-gray-600">Personal workspace</p>
                      </div>
                    </div>
                    <button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        deleteWorkspace(workspace.id);
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Boards Content */}
          <div className="flex-1 pl-12 border-l border-gray-200">
            {selectedWorkspace ? (
              <>
                <div className="flex items-center justify-between mb-16">
                  <div>
                    <div className="flex items-center space-x-4 mb-8">
                      {selectedWorkspace.image_url ? (
                        <img
                          src={selectedWorkspace.image_url}
                          alt={selectedWorkspace.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                          <Users size={24} {...({ stroke: "white" } as any)} />
                        </div>
                      )}
                      <h2 className="text-3xl font-bold text-gray-800">{selectedWorkspace.name}</h2>
                    </div>
                    <p className="text-gray-600 ml-16 text-lg">Boards in this workspace</p>
                  </div>
                  <button
                    onClick={() => setShowCreateBoard(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Plus size={20} />
                    <span>Create Board</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {boards.map((board) => (
                    <a
                      key={board.id}
                      href={`/board/${board.id}`}
                      className="block p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      <h3 className="text-xl font-semibold mb-2">{board.name}</h3>
                      <p className="text-blue-100">Click to open board</p>
                    </a>
                  ))}
                  
                  {boards.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">📋</div>
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">No boards yet</h3>
                      <p className="text-gray-500">Create your first board to get started</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-20 pl-12">
                <div className="text-gray-400 text-6xl mb-4">🏢</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a workspace</h3>
                <p className="text-gray-500">Choose a workspace from the left to see its boards</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Workspace Modal */}
        {showCreateWorkspace && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Create New Workspace</h3>
              <form onSubmit={createWorkspace}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWorkspaceName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter workspace name"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL (optional)
                  </label>
                  <input
                    type="url"
                    value={workspaceImage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWorkspaceImage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter image URL"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateWorkspace(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Board Modal */}
        {showCreateBoard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Create New Board</h3>
              <form onSubmit={createBoard}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Board Name
                  </label>
                  <input
                    type="text"
                    value={boardName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBoardName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter board name"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateBoard(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      }
    />
  );
}