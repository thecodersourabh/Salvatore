import { api } from './api';

const CHAT_API_BASE = import.meta.env.VITE_CHAT_API_URL;

export interface Team {
  id: string;
  teamId?: string;
  name: string;
  description?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  members?: TeamMember[];
  memberCount?: number;
}

export interface TeamMember {
  userId: string;
  userName?: string;
  displayName?: string;
  name?: string;
  avatar?: string;
  email?: string;
  role?: 'admin' | 'member';
  joinedAt?: string;
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
  memberIds: string[];
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
}

export interface TeamMessage {
  id?: string;
  messageId?: string;
  teamId: string;
  senderId: string;
  content: string;
  type?: string;
  createdAt?: string;
  timestamp?: string;
}

export interface SendTeamMessagePayload {
  teamId: string;
  content: string;
  type?: string;
}

export interface GetTeamMessagesParams {
  teamId: string;
  limit?: number;
  lastKey?: string;
}

export class TeamService {
  /**
   * Get a specific team by ID
   */
  static async getTeam(teamId: string): Promise<Team> {
    try {
      const endpoint = `${CHAT_API_BASE.replace(/\/$/, '')}/teams/${teamId}`;
      const result = await api.get<any>(endpoint);
      return result?.data || result;
    } catch (error) {
      console.error('TeamService.getTeam failed:', error);
      throw error;
    }
  }

  /**
   * Get all teams for the authenticated user
   */
  static async getTeams(): Promise<Team[]> {
    try {
      const endpoint = `${CHAT_API_BASE.replace(/\/$/, '')}/teams`;
      const result = await api.get<any>(endpoint);
      const data = result?.data || result?.teams || result;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('TeamService.getTeams failed:', error);
      return [];
    }
  }

  /**
   * Create a new team
   */
  static async createTeam(payload: CreateTeamPayload): Promise<Team> {
    try {
      const endpoint = `${CHAT_API_BASE.replace(/\/$/, '')}/teams`;
      const result = await api.post<any>(endpoint, payload);
      return result?.data || result;
    } catch (error) {
      console.error('TeamService.createTeam failed:', error);
      throw error;
    }
  }

  /**
   * Update a team (rename, change description)
   */
  static async updateTeam(teamId: string, payload: UpdateTeamPayload): Promise<Team> {
    try {
      const endpoint = `${CHAT_API_BASE.replace(/\/$/, '')}/teams/${teamId}`;
      const result = await api.put<any>(endpoint, payload);
      return result?.data || result;
    } catch (error) {
      console.error('TeamService.updateTeam failed:', error);
      throw error;
    }
  }

  /**
   * Get team members
   */
  static async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
      const endpoint = `${CHAT_API_BASE.replace(/\/$/, '')}/teams/${teamId}/members`;
      const result = await api.get<any>(endpoint);
      const data = result?.data || result?.members || result;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('TeamService.getTeamMembers failed:', error);
      return [];
    }
  }

  /**
   * Add a member to a team
   */
  static async addTeamMember(teamId: string, userId: string): Promise<any> {
    try {
      const endpoint = `${CHAT_API_BASE.replace(/\/$/, '')}/teams/${teamId}/members`;
      const result = await api.post<any>(endpoint, { userId });
      return result?.data || result;
    } catch (error) {
      console.error('TeamService.addTeamMember failed:', error);
      throw error;
    }
  }

  /**
   * Add multiple members to a team (calls addTeamMember for each)
   */
  static async addTeamMembers(teamId: string, userIds: string[]): Promise<any[]> {
    try {
      const results = await Promise.all(
        userIds.map(userId => this.addTeamMember(teamId, userId))
      );
      return results;
    } catch (error) {
      console.error('TeamService.addTeamMembers failed:', error);
      throw error;
    }
  }

  /**
   * Remove a member from a team
   */
  static async removeTeamMember(teamId: string, userId: string): Promise<void> {
    try {
      const endpoint = `${CHAT_API_BASE.replace(/\/$/, '')}/teams/${teamId}/members/${userId}`;
      await api.delete<any>(endpoint);
    } catch (error) {
      console.error('TeamService.removeTeamMember failed:', error);
      throw error;
    }
  }

  /**
   * Get team messages
   */
  static async getTeamMessages(params: GetTeamMessagesParams): Promise<TeamMessage[]> {
    try {
      const { teamId, limit = 50, lastKey } = params;
      const endpoint = `${CHAT_API_BASE.replace(/\/$/, '')}/messages`;
      const queryParams: any = { teamId, limit };
      if (lastKey) queryParams.lastKey = lastKey;
      
      const result = await api.get<any>(endpoint, { params: queryParams });
      const data = result?.data || result?.messages || result;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('TeamService.getTeamMessages failed:', error);
      return [];
    }
  }

  /**
   * Send a message to a team
   */
  static async sendTeamMessage(payload: SendTeamMessagePayload): Promise<TeamMessage> {
    try {
      const endpoint = `${CHAT_API_BASE.replace(/\/$/, '')}/messages`;
      const result = await api.post<any>(endpoint, payload);
      return result?.data || result;
    } catch (error) {
      console.error('TeamService.sendTeamMessage failed:', error);
      throw error;
    }
  }

  /**
   * Clear all messages in a team chat (delete message history)
   */
  static async clearTeamMessages(teamId: string): Promise<void> {
    try {
      const endpoint = `${CHAT_API_BASE.replace(/\/$/, '')}/teams/${teamId}/messages`;
      await api.delete<any>(endpoint);
    } catch (error) {
      console.error('TeamService.clearTeamMessages failed:', error);
      throw error;
    }
  }

  /**
   * Leave a team (removes current user from team and deletes their message history)
   */
  static async leaveTeam(teamId: string): Promise<void> {
    try {
      const endpoint = `${CHAT_API_BASE.replace(/\/$/, '')}/teams/${teamId}/leave`;
      await api.post<any>(endpoint, {});
    } catch (error) {
      console.error('TeamService.leaveTeam failed:', error);
      throw error;
    }
  }

  /**
   * Delete a team completely (admin only - removes team for all members)
   */
  static async deleteTeam(teamId: string): Promise<void> {
    try {
      const endpoint = `${CHAT_API_BASE.replace(/\/$/, '')}/teams/${teamId}`;
      await api.delete<any>(endpoint);
    } catch (error) {
      console.error('TeamService.deleteTeam failed:', error);
      throw error;
    }
  }
}

export const teamService = TeamService;
