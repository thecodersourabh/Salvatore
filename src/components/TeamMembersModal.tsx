import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserMinus, Users, Search } from 'lucide-react';
import { teamService, TeamMember } from '../services/teamService';
import { UserService } from '../services/userService';
import { User } from '../types/user';
import { useAuth } from '../hooks/useAuth';
import { useBackButton } from '../hooks/useBackButton';

interface TeamMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
}

export const TeamMembersModal: React.FC<TeamMembersModalProps> = ({
  isOpen,
  onClose,
  teamId,
  teamName,
}) => {
  const { apiUser } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  // Handle hardware back button on mobile
  useBackButton(isOpen, onClose, 2);

  // Helper to check if a userId matches the current user
  const isCurrentUser = (userId: string) => {
    if (!apiUser) return false;
    // Check both id and auth0Id
    return userId === apiUser.id || userId === apiUser.auth0Id;
  };

  // Load team members
  useEffect(() => {
    if (isOpen && teamId) {
      loadMembers();
    }
  }, [isOpen, teamId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const teamMembers = await teamService.getTeamMembers(teamId);
      
      // Enrich member data by fetching user details for each userId
      const enrichedMembers = await Promise.all(
        teamMembers.map(async (member) => {
          
          // If member already has sufficient user details, use them
          if (member.displayName || member.name || member.userName) {
            console.log('Member already has details:', member);
            return member;
          }
          
          // Check if this is the current logged-in user
          if (apiUser && isCurrentUser(member.userId)) {
            return {
              ...member,
              actualUserId: apiUser.id,
              userName: apiUser.userName || member.userId,
              displayName: apiUser.displayName || apiUser.name,
              name: apiUser.name,
              avatar: apiUser.avatar,
              email: apiUser.email,
            };
          }
          
          // Otherwise try to search for user by auth0Id or id
          try {
            // Try searching - this works with both id and auth0Id
            const searchResults = await UserService.searchUsers(
              { q: member.userId },
              ['id', 'auth0Id', 'userName', 'name', 'avatar', 'email', 'displayName']
            );
            
            // Find matching user by id or auth0Id
            const userDetails = searchResults.find(u => 
              u.id === member.userId || u.auth0Id === member.userId
            );
            
            if (userDetails) {
              return {
                ...member,
                // Store the actual database ID for operations like remove
                actualUserId: userDetails.id,
                userName: userDetails.userName || member.userId,
                displayName: userDetails.displayName || userDetails.name,
                name: userDetails.name,
                avatar: userDetails.avatar,
                email: userDetails.email,
              };
            }
            
            return {
              ...member,
              userName: member.userId,
              displayName: member.userId
            };
          } catch (error) {
            console.error(`Failed to fetch user details for ${member.userId}:`, error);
            // Return member with userId as fallback for display
            return {
              ...member,
              userName: member.userId,
              displayName: member.userId
            };
          }
        })
      );
      
      setMembers(enrichedMembers);
    } catch (error) {
      console.error('Failed to load team members:', error);
      setMembers([]);
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
        setSearching(true);
        const users = await UserService.searchUsers(
          { q: searchQuery },
          ['id', 'userName', 'name', 'avatar', 'email', 'displayName']
        );
        // Filter out current members and logged-in user
        const memberIds = members.map(m => m.userId);
        const filteredUsers = users.filter(u => 
          !isCurrentUser(u.id) && !isCurrentUser(u.auth0Id || '') && !memberIds.includes(u.id) && !memberIds.includes(u.auth0Id || '')
        );
        setSearchResults(filteredUsers);
      } catch (error) {
        console.error('Failed to search users:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery, members, apiUser]);

  const handleAddMember = async (user: User) => {
    try {
      // Use the database id for the API call
      await teamService.addTeamMembers(teamId, [user.id]);
      // Add to local state - store auth0Id as userId for display consistency
      setMembers(prev => [...prev, {
        userId: user.auth0Id || user.id,
        actualUserId: user.id,
        userName: user.userName,
        displayName: user.displayName || user.name,
        name: user.name,
        avatar: user.avatar,
        email: user.email,
        role: 'member',
        joinedAt: new Date().toISOString()
      }]);
      setSearchQuery('');
      setSearchResults([]);
      setShowAddMember(false);
    } catch (error) {
      console.error('Failed to add member:', error);
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    try {
      // Use actualUserId (database id) if available, otherwise use userId
      const userIdToRemove = (member as any).actualUserId || member.userId;
      
      await teamService.removeTeamMember(teamId, userIdToRemove);
      // Remove from local state
      setMembers(prev => prev.filter(m => m.userId !== member.userId));
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const getUserInitials = (member: TeamMember) => {
    const displayName = member.displayName || member.name || member.userName || member.userId;
    if (!displayName) return 'U';
    
    return displayName
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('') || 'U';
  };

  const getUserDisplayName = (member: TeamMember) => {
    return member.displayName || member.name || member.userName || member.userId || 'Unknown User';
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 max-sm:bg-transparent"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-sm:mx-0 max-sm:max-w-full max-sm:h-full max-sm:rounded-none max-sm:pt-[env(safe-area-inset-top)] max-sm:pb-[env(safe-area-inset-bottom)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-rose-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {teamName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] max-sm:flex-1 overflow-y-auto">
          {/* Add Member Section */}
          {showAddMember ? (
            <div className="p-4 border-b dark:border-gray-700">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users to add..."
                  className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  autoFocus
                />
              </div>

              {/* Search Results */}
              {searching ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-2">
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleAddMember(user)}
                      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.displayName || user.name || user.userName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white font-semibold">
                          {user.displayName?.charAt(0) || user.name?.charAt(0) || user.userName.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {user.displayName || user.name || user.userName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {user.email || `@${user.userName}`}
                        </div>
                      </div>
                      <UserPlus className="w-5 h-5 text-rose-600" />
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-2">
                  No users found
                </div>
              ) : null}

              <button
                onClick={() => {
                  setShowAddMember(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="mt-3 w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="p-4 border-b dark:border-gray-700">
              <button
                onClick={() => setShowAddMember(true)}
                className="w-full py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Add Member
              </button>
            </div>
          )}

          {/* Members List */}
          {loading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Loading members...
            </div>
          ) : members.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No members yet
            </div>
          ) : (
            <div className="divide-y dark:divide-gray-700">
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  {/* Avatar */}
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={getUserDisplayName(member)}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white font-semibold">
                      {getUserInitials(member)}
                    </div>
                  )}

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-gray-900 dark:text-white truncate">
                        {getUserDisplayName(member)}
                      </div>
                      {isCurrentUser(member.userId) ? (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                          You
                        </span>
                      ) : member.role === 'admin' && (
                        <span className="text-xs px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {member.email || (member.userName && member.userName !== member.userId ? `@${member.userName}` : member.userId)}
                    </div>
                  </div>

                  {/* Remove Button */}
                  {!isCurrentUser(member.userId) && (
                    <button
                      onClick={() => handleRemoveMember(member)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Remove member"
                    >
                      <UserMinus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
