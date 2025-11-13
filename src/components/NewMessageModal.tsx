import React, { useState, useEffect } from 'react';
import { X, Search, Users } from 'lucide-react';
import { UserService } from '../services/userService';
import { User } from '../types/user';
import { useAuth } from '../context/AuthContext';

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConversationDetailModalOpen?: boolean;
  onSelectUser: (user: User) => void;
  onCreateGroup?: (users: User[], groupName: string) => void;
}

export const NewMessageModal: React.FC<NewMessageModalProps> = ({
  isOpen,
  onClose,
  isConversationDetailModalOpen,
  onSelectUser,
  onCreateGroup,
}) => {
  const { apiUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);

  // Load suggested users on mount
  useEffect(() => {
    if (isOpen && !searchQuery) {
      loadSuggestedUsers();
    }
  }, [isOpen, searchQuery]);

  const loadSuggestedUsers = async () => {
    try {
      setLoading(true);
      // Load some suggested users - try to get all users with a limit
      const users = await UserService.getAllUsers(20, ['id', 'userName', 'name', 'avatar', 'email', 'displayName']);
      // Filter out the current logged-in user
      const filteredUsers = users.filter(u => u.id !== apiUser?.id);
      setSuggestedUsers(filteredUsers || []);
    } catch (error) {
      console.error('Failed to load suggested users:', error);
      setSuggestedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Search users when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delaySearch = setTimeout(async () => {
      try {
        setLoading(true);
        const users = await UserService.searchUsers(
          { q: searchQuery },
          ['id', 'userName', 'name', 'avatar', 'email', 'displayName']
        );
        // Filter out the current logged-in user
        const filteredUsers = users.filter(u => u.id !== apiUser?.id);
        setSearchResults(filteredUsers);
      } catch (error) {
        console.error('Failed to search users:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const handleUserClick = (user: User) => {
    if (isGroupMode) {
      // Toggle user selection for group
      if (selectedUsers.some(u => u.id === user.id)) {
        setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
      } else {
        setSelectedUsers([...selectedUsers, user]);
      }
    } else {
      // Direct message - select and close
      onSelectUser(user);
      handleClose();
    }
  };

  const handleCreateGroup = () => {
    if (selectedUsers.length > 0 && onCreateGroup) {
      onCreateGroup(selectedUsers, groupName || `Group (${selectedUsers.length + 1})`);
      handleClose();
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
    setIsGroupMode(false);
    setGroupName('');
    onClose();
  };

  const getUserInitials = (user: User) => {
    const displayName = user.displayName || user.name || user.userName || 'U';
    return displayName
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('') || 'U';
  };

  const getUserDisplayName = (user: User) => {
    return user.displayName || user.name || user.userName || 'Unknown User';
  };

  const displayedUsers = searchQuery.trim() ? searchResults : suggestedUsers;

  if (!isOpen) return null;

  // Calculate margin based on what's open
  // ChatBot is always 280px, ConversationDetailModal is 460px when open
  const marginRight = isConversationDetailModalOpen ? 740 : 280; // 280 (ChatBot) + 460 (ConversationDetail) or just 280 (ChatBot)

  return (
    <div className="fixed bottom-6 right-6 z-50 max-sm:inset-0 max-sm:bottom-0 max-sm:right-0" style={{ marginRight: window.innerWidth < 640 ? '0px' : `${marginRight}px` }} onClick={handleClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[280px] h-[520px] max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:pt-[max(3rem,env(safe-area-inset-top))] max-sm:pb-20 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New message</h2>
            {onCreateGroup && (
              <button
                onClick={() => setIsGroupMode(!isGroupMode)}
                className={`p-2 rounded-full transition-colors ${
                  isGroupMode
                    ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={isGroupMode ? 'Switch to direct message' : 'Create group'}
              >
                <Users className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type a name or multiple names"
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              autoFocus
            />
          </div>

          {/* Selected Users Pills (Group Mode) */}
          {isGroupMode && selectedUsers.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-1 px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-full text-sm"
                >
                  <span>{getUserDisplayName(user)}</span>
                  <button
                    onClick={() => setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))}
                    className="hover:bg-rose-200 dark:hover:bg-rose-800/50 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Group Name Input (Group Mode) */}
        {isGroupMode && selectedUsers.length > 0 && (
          <div className="px-4 py-3 border-b dark:border-gray-700">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={`Group name (optional)`}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        )}

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">Searching...</div>
          ) : (
            <>
              {!searchQuery && (
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Suggested
                </div>
              )}
              {displayedUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No users found' : 'No suggested users'}
                </div>
              ) : (
                <div className="divide-y dark:divide-gray-700">
                  {displayedUsers.map((user) => {
                    const isSelected = selectedUsers.some(u => u.id === user.id);
                    return (
                      <div
                        key={user.id}
                        onClick={() => handleUserClick(user)}
                        className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-rose-50 dark:bg-rose-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={getUserDisplayName(user)}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white font-semibold">
                              {getUserInitials(user)}
                            </div>
                          )}
                          {isGroupMode && (
                            <div
                              className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs ${
                                isSelected
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                              }`}
                            >
                              {isSelected ? '✓' : ''}
                            </div>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white truncate">
                            {getUserDisplayName(user)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {user.email || `@${user.userName}`}
                          </div>
                        </div>

                        {/* Selection indicator for group mode */}
                        {isGroupMode && isSelected && (
                          <div className="text-rose-600 dark:text-rose-400">
                            <Users className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer (Group Mode) */}
        {isGroupMode && selectedUsers.length > 0 && (
          <div className="p-4 border-t dark:border-gray-700">
            <button
              onClick={handleCreateGroup}
              className="w-full py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors"
            >
              Create Group ({selectedUsers.length + 1})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
