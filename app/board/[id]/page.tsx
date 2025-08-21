'use client';
import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Plus, X, Edit3, Trash2, GripVertical } from 'lucide-react';

interface Card {
  id: number;
  title: string;
  description?: string;
  list_id: number;
  position: number;
}

interface List {
  id: number;
  title: string;
  board_id: number;
  position: number;
  cards: Card[];
}

interface Board {
  id: number;
  name: string;
  workspace_id: number;
}

interface Workspace {
  id: number;
  name: string;
  image_url?: string;
}

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const [board, setBoard] = useState<Board | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  
  // UI state
  const [showAddList, setShowAddList] = useState(false);
  const [showAddCard, setShowAddCard] = useState<number | null>(null);
  const [editingCard, setEditingCard] = useState<number | null>(null);
  const [editingList, setEditingList] = useState<number | null>(null);
  const [editingBoardName, setEditingBoardName] = useState(false);
  const [editingWorkspaceName, setEditingWorkspaceName] = useState(false);
  
  // Form state
  const [newListTitle, setNewListTitle] = useState('');
  const [newCardTitle, setNewCardTitle] = useState('');
  const [editCardTitle, setEditCardTitle] = useState('');
  const [editListTitle, setEditListTitle] = useState('');
  const [editBoardName, setEditBoardName] = useState('');
  const [editWorkspaceName, setEditWorkspaceName] = useState('');
  
  // Drag and drop state
  const [draggedCard, setDraggedCard] = useState<Card | null>(null);
  const [draggedList, setDraggedList] = useState<List | null>(null);
  const [dragOverList, setDragOverList] = useState<number | null>(null);

  const resolvedParams = React.use(params);
  const boardId = Number(resolvedParams.id);

  useEffect(() => {
    fetchBoard();
    fetchLists();
    fetchUser();
  }, [boardId]);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/profile');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchBoard = async () => {
    try {
      const response = await fetch(`/api/boards/${boardId}`);
      if (response.ok) {
        const data = await response.json();
        setBoard(data);
        
        // Fetch workspace info
        const workspaceResponse = await fetch(`/api/workspaces/${data.workspace_id}`);
        if (workspaceResponse.ok) {
          const workspaceData = await workspaceResponse.json();
          setWorkspace(workspaceData);
        }
      }
    } catch (error) {
      console.error('Error fetching board:', error);
    }
  };

  const fetchLists = async () => {
    try {
      const response = await fetch(`/api/boards/${boardId}/lists`);
      if (response.ok) {
        const listsData = await response.json();
        
        // Sort lists by position to maintain order
        const sortedLists = listsData.sort((a: List, b: List) => a.position - b.position);
        

        
        // Fetch cards for each list
        const listsWithCards = await Promise.all(
          sortedLists.map(async (list: List) => {
            try {
              const cardsResponse = await fetch(`/api/lists/${list.id}/cards`);
              if (cardsResponse.ok) {
                const cards = await cardsResponse.json();
                // Sort cards by position within each list
                const sortedCards = cards.sort((a: Card, b: Card) => a.position - b.position);
                return { ...list, cards: sortedCards };
              }
              return { ...list, cards: [] };
            } catch (error) {
              console.error(`Error fetching cards for list ${list.id}:`, error);
              return { ...list, cards: [] };
            }
          })
        );
        
        setLists(listsWithCards);
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setLoading(false);
    }
  };

  // List operations
  const createList = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/boards/${boardId}/lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          title: newListTitle, 
          position: lists.length 
        })
      });

      if (response.ok) {
        fetchLists();
        setShowAddList(false);
        setNewListTitle('');
      }
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const updateList = async (listId: number, title: string) => {
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title })
      });

      if (response.ok) {
        fetchLists();
        setEditingList(null);
      }
    } catch (error) {
      console.error('Error updating list:', error);
    }
  };

  const deleteList = async (listId: number) => {
    if (!confirm('Are you sure you want to delete this list and all its cards?')) return;

    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        fetchLists();
      }
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  // Board operations
  const updateBoard = async (name: string) => {
    if (!name.trim() || !board) return;

    try {
      const response = await fetch(`/api/boards/${board.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });

      if (response.ok) {
        setBoard({ ...board, name });
        setEditingBoardName(false);
      }
    } catch (error) {
      console.error('Error updating board:', error);
    }
  };

  // Workspace operations
  const updateWorkspace = async (name: string) => {
    if (!name.trim() || !workspace) return;

    try {
      const response = await fetch(`/api/workspaces/${workspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });

      if (response.ok) {
        setWorkspace({ ...workspace, name });
        setEditingWorkspaceName(false);
      }
    } catch (error) {
      console.error('Error updating workspace:', error);
    }
  };

  // Card operations
  const createCard = async (e: React.FormEvent, listId: number) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/lists/${listId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: newCardTitle })
      });

      if (response.ok) {
        // Update frontend state directly instead of refetching
        const newCard = { id: Date.now(), title: newCardTitle, list_id: listId, position: 0, cards: [] };
        setLists(prevLists => 
          prevLists.map(list => 
            list.id === listId 
              ? { ...list, cards: [...(list.cards || []), newCard] }
              : list
          )
        );
        setShowAddCard(null);
        setNewCardTitle('');
      }
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  const updateCard = async (cardId: number, title: string) => {
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title })
      });

      if (response.ok) {
        // Update frontend state directly instead of refetching
        setLists(prevLists => 
          prevLists.map(list => ({
            ...list,
            cards: list.cards?.map(card => 
              card.id === cardId ? { ...card, title } : card
            ) || []
          }))
        );
        setEditingCard(null);
      }
    } catch (error) {
      console.error('Error updating card:', error);
    }
  };

  const deleteCard = async (cardId: number) => {
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        // Update frontend state directly instead of refetching
        setLists(prevLists => 
          prevLists.map(list => ({
            ...list,
            cards: list.cards?.filter(card => card.id !== cardId) || []
          }))
        );
      }
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  // Drag and drop handlers
  const handleCardDragStart = (e: React.DragEvent, card: Card) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleListDragStart = (e: React.DragEvent, list: List) => {
    setDraggedList(list);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCardDragOver = (e: React.DragEvent, listId: number) => {
    e.preventDefault();
    setDragOverList(listId);
  };

  const handleCardDragLeave = () => {
    setDragOverList(null);
  };

  const handleCardDrop = async (e: React.DragEvent, targetListId: number) => {
    e.preventDefault();
    setDragOverList(null);

    if (!draggedCard) return;

    // Check if the card is being moved to the same list
    if (draggedCard.list_id === targetListId) {
      console.log('Card dropped in same list - no movement needed');
      setDraggedCard(null);
      return;
    }

    // Store original state to revert if the move fails
    const originalLists = [...lists];
    const originalCard = { ...draggedCard };

    try {
      const targetList = lists.find(l => l.id === targetListId);
      if (!targetList) return;

      // Calculate new position - ensure it's valid
      let newPosition = 0;
      if (targetList.cards && targetList.cards.length > 0) {
        // Find the highest position and add 1
        newPosition = Math.max(...targetList.cards.map(c => c.position || 0)) + 1;
      }
      
      console.log('Position calculation:', {
        targetListCards: targetList.cards?.length || 0,
        calculatedPosition: newPosition
      });

      // Optimistically update the UI first
      setLists(prevLists => {
        return prevLists.map(list => {
          if (list.id === draggedCard.list_id) {
            // Remove card from source list
            return {
              ...list,
              cards: list.cards?.filter(c => c.id !== draggedCard.id) || []
            };
          } else if (list.id === targetListId) {
            // Add card to target list
            const updatedCard = { ...draggedCard, list_id: targetListId, position: newPosition };
            return {
              ...list,
              cards: [...(list.cards || []), updatedCard]
            };
          }
          return list;
        });
      });

      // Debug: Check if we have authentication cookies
      console.log('Moving card with credentials:', {
        cardId: draggedCard.id,
        fromListId: draggedCard.list_id,
        toListId: targetListId,
        hasCredentials: 'include'
      });

      // Debug: Log the request details
      const requestBody = { 
        list_id: targetListId,
        position: newPosition
      };
      console.log('Moving card with request:', requestBody);

      const response = await fetch(`/api/cards/${draggedCard.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        // Success - keep the updated state
        console.log('Card moved successfully');
      } else {
        console.error('Failed to move card:', response.status);
        
        // Try to get more error details
        try {
          const errorData = await response.text();
          console.error('Error response body:', errorData);
        } catch (e) {
          console.error('Could not read error response');
        }
        
        // Revert to original state if the move failed
        setLists(originalLists);
        console.log('Reverted to original state due to API failure');
      }
    } catch (error) {
      console.error('Error moving card:', error);
      // Revert to original state if there was an error
      setLists(originalLists);
      console.log('Reverted to original state due to error');
    }

    setDraggedCard(null);
  };

  const handleListDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleListDrop = async (e: React.DragEvent, targetList: List) => {
    e.preventDefault();
    
    if (!draggedList || draggedList.id === targetList.id) {
      setDraggedList(null);
      return;
    }

    try {
      // Get current positions and sort lists
      const sortedLists = [...lists].sort((a, b) => a.position - b.position);
      const draggedIndex = sortedLists.findIndex(l => l.id === draggedList.id);
      const targetIndex = sortedLists.findIndex(l => l.id === targetList.id);
      
      if (draggedIndex === -1 || targetIndex === -1) return;
      
      // Remove dragged list from current position
      sortedLists.splice(draggedIndex, 1);
      
      // Insert at new position
      sortedLists.splice(targetIndex, 0, draggedList);
      
      // Update positions sequentially (0, 1, 2, 3...)
      const updatePromises = sortedLists.map((list, index) => 
        fetch(`/api/lists/${list.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ position: index })
        })
      );
      
      const responses = await Promise.all(updatePromises);
      const allSuccessful = responses.every(r => r.ok);
      
      if (allSuccessful) {
        // Update frontend state directly instead of refetching
        setLists(prevLists => {
          const updatedLists = [...prevLists];
          sortedLists.forEach((list, index) => {
            const existingList = updatedLists.find(l => l.id === list.id);
            if (existingList) {
              existingList.position = index;
            }
          });
          return updatedLists.sort((a, b) => a.position - b.position);
        });
      } else {
        console.error('Failed to update some list positions');
        responses.forEach((response, index) => {
          if (!response.ok) {
            console.error(`List update ${index} failed:`, response.status, response.statusText);
          }
        });
      }
    } catch (error) {
      console.error('Error moving list:', error);
    }

    setDraggedList(null);
  };

  if (loading) {
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
      user={user || undefined}
      children={
        <div className="h-screen bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
        {/* Board Header */}
        <div className="bg-black bg-opacity-20 text-white py-6 border-b border-white border-opacity-20">
          <div className="px-16">
            {/* Workspace Name */}
            {workspace && (
              <div className="mb-2">
                {editingWorkspaceName ? (
                  <input
                    type="text"
                    value={editWorkspaceName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEditWorkspaceName(e.target.value)}
                    onBlur={() => updateWorkspace(editWorkspaceName)}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === 'Enter') updateWorkspace(editWorkspaceName);
                      if (e.key === 'Escape') setEditingWorkspaceName(false);
                    }}
                    className="text-lg bg-transparent border-b border-white text-blue-100 placeholder-blue-200 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <span 
                    className="text-blue-100 text-lg cursor-pointer hover:bg-white hover:bg-opacity-10 rounded px-2 py-1 transition-colors inline-block"
                    onClick={() => {
                      setEditingWorkspaceName(true);
                      setEditWorkspaceName(workspace?.name || '');
                    }}
                  >
                    {workspace.name}
                  </span>
                )}
              </div>
            )}
            
            {/* Board Name */}
            {editingBoardName ? (
              <input
                type="text"
                value={editBoardName}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEditBoardName(e.target.value)}
                onBlur={() => updateBoard(editBoardName)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') updateBoard(editBoardName);
                  if (e.key === 'Escape') setEditingBoardName(false);
                }}
                className="text-3xl font-bold mb-2 bg-transparent border-b-2 border-white text-white placeholder-blue-100 focus:outline-none"
                autoFocus
              />
            ) : (
              <h1 
                className="text-3xl font-bold mb-2 cursor-pointer hover:bg-white hover:bg-opacity-10 rounded px-2 py-1 transition-colors inline-block"
                onClick={() => {
                  setEditingBoardName(true);
                  setEditBoardName(board?.name || '');
                }}
              >
                {board?.name || 'Loading...'}
              </h1>
            )}
          </div>
        </div>

        {/* Board Content */}
        <div className="flex h-full overflow-x-auto px-16 py-8 space-x-6">
          {/* Lists */}
          {lists.map((list) => (
            <div
              key={list.id}
              className="flex-shrink-0 w-80 bg-gray-100 rounded-lg p-3 self-start"
              onDragOver={(e: React.DragEvent) => handleListDragOver(e)}
              onDrop={(e: React.DragEvent) => {
                // Only handle list drops if no card is being dragged
                if (!draggedCard) {
                  handleListDrop(e, list);
                }
              }}
              draggable
              onDragStart={(e: React.DragEvent) => handleListDragStart(e, list)}
            >
              {/* List Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 flex-1">
                  <GripVertical size={16} {...({ className: "text-gray-400 cursor-grab" } as any)} />
                  {editingList === list.id ? (
                    <input
                      type="text"
                      value={editListTitle}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEditListTitle(e.target.value)}
                      onBlur={() => updateList(list.id, editListTitle)}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') updateList(list.id, editListTitle);
                        if (e.key === 'Escape') setEditingList(null);
                      }}
                      className="flex-1 px-2 py-1 text-sm font-semibold bg-white border rounded"
                      autoFocus
                    />
                  ) : (
                    <h3
                      className="font-semibold text-gray-800 flex-1 cursor-pointer"
                      onClick={() => {
                        setEditingList(list.id);
                        setEditListTitle(list.title);
                      }}
                    >
                      {list.title}
                    </h3>
                  )}
                </div>
                <button
                  onClick={() => deleteList(list.id)}
                  className="text-gray-500 hover:text-red-500 p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Cards */}
              <div
                className={`flex-1 space-y-2 overflow-y-auto min-h-[100px] ${
                  dragOverList === list.id ? 'bg-blue-100 border-2 border-blue-300 border-dashed rounded' : ''
                }`}
                onDragOver={(e: React.DragEvent) => handleCardDragOver(e, list.id)}
                onDragLeave={handleCardDragLeave}
                onDrop={(e: React.DragEvent) => handleCardDrop(e, list.id)}
              >
                {list.cards?.map((card) => (
                  <div
                    key={card.id}
                    className="bg-white p-3 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                    draggable
                    onDragStart={(e: React.DragEvent) => handleCardDragStart(e, card)}
                  >
                    <div className="flex items-start justify-between">
                      {editingCard === card.id ? (
                        <input
                          type="text"
                          value={editCardTitle}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEditCardTitle(e.target.value)}
                          onBlur={() => updateCard(card.id, editCardTitle)}
                          onKeyDown={(e: React.KeyboardEvent) => {
                            if (e.key === 'Enter') updateCard(card.id, editCardTitle);
                            if (e.key === 'Escape') setEditingCard(null);
                          }}
                          className="flex-1 px-2 py-1 text-sm border rounded"
                          autoFocus
                        />
                      ) : (
                        <p
                          className="text-sm text-gray-800 flex-1"
                          onClick={() => {
                            setEditingCard(card.id);
                            setEditCardTitle(card.title);
                          }}
                        >
                          {card.title}
                        </p>
                      )}
                      <button
                        onClick={() => deleteCard(card.id)}
                        className="text-gray-400 hover:text-red-500 ml-2"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Card Button */}
                {showAddCard === list.id ? (
                  <form onSubmit={(e: React.FormEvent) => createCard(e, list.id)} className="space-y-2">
                    <textarea
                      value={newCardTitle}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewCardTitle(e.target.value)}
                      placeholder="Enter a title for this card..."
                      className="w-full p-2 text-sm border rounded resize-none"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Add Card
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCard(null);
                          setNewCardTitle('');
                        }}
                        className="px-3 py-1 text-gray-600 text-sm hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowAddCard(list.id)}
                    className="w-full p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span className="text-sm">Add a card</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add List */}
          <div className="flex-shrink-0 w-80">
            {showAddList ? (
              <div className="bg-gray-100 rounded-lg p-3">
                <form onSubmit={createList} className="space-y-3">
                  <input
                    type="text"
                    value={newListTitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewListTitle(e.target.value)}
                    placeholder="Enter list title..."
                    className="w-full p-2 text-sm border rounded"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Add List
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddList(false);
                        setNewListTitle('');
                      }}
                      className="px-3 py-2 text-gray-600 text-sm hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <button
                onClick={() => setShowAddList(true)}
                className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-lg transition-all flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Add another list</span>
              </button>
            )}
          </div>
        </div>
      </div>
      }
    />
  );
}