import { useState } from 'react';

interface AppConfigService {
  getBaseUrl(): string;
}

interface GroupServiceProps {
  appConfig: AppConfigService;
}

const GroupService = ({ appConfig }: GroupServiceProps) => {
  const apiUrl = `${appConfig.getBaseUrl()}/api/Groups`;

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  };

  const createGroupChat = async (request: FormData) => {
    return await fetchWithAuth(`${apiUrl}/create-group-chat`, {
      method: 'POST',
      body: request,
    });
  };

  const addGroupChatMember = async (request: { GroupId: string; UserId: string }) => {
    const formData = new FormData();
    formData.append('GroupId', request.GroupId);
    formData.append('UserId', request.UserId);
    return await fetchWithAuth(`${apiUrl}/add-group-chat-member`, {
      method: 'POST',
      body: formData,
    });
  };

  const deleteGroup = async (groupId: string) => {
    return await fetchWithAuth(`${apiUrl}/${groupId}/delete`, {
      method: 'DELETE',
    });
  };

  const getGroupMembers = async (groupId: string) => {
    return await fetchWithAuth(`${apiUrl}/${groupId}/members`);
  };

  const removeGroupMember = async (request: { GroupId: string; UserId: string }) => {
    const formData = new FormData();
    formData.append('GroupId', request.GroupId);
    formData.append('UserId', request.UserId);
    return await fetchWithAuth(`${apiUrl}/remove-member`, {
      method: 'DELETE',
      body: formData,
    });
  };

  const getUserGroupsWithDetails = async (userId: string) => {
    return await fetchWithAuth(`${apiUrl}/user-groups-with-details/${userId}`);
  };

  const renameGroup = async (groupId: string, newName: string) => {
    return await fetchWithAuth(`${apiUrl}/rename-group`, {
      method: 'PUT',
      body: JSON.stringify({ groupId, newName }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  const updateGroupAdmin = async (request: { GroupId: string; UserId: string }) => {
    const formData = new FormData();
    formData.append('GroupId', request.GroupId);
    formData.append('UserId', request.UserId);
    return await fetchWithAuth(`${apiUrl}/update-admin`, {
      method: 'POST',
      body: formData,
    });
  };

  const revokeGroupAdmin = async (request: { GroupId: string; UserId: string }) => {
    const formData = new FormData();
    formData.append('GroupId', request.GroupId);
    formData.append('UserId', request.UserId);
    return await fetchWithAuth(`${apiUrl}/revoke-admin`, {
      method: 'POST',
      body: formData,
    });
  };

  const updateGroupAvatar = async (request: { GroupId: string; AvatarFile: File }) => {
    const formData = new FormData();
    formData.append('GroupId', request.GroupId);
    formData.append('AvatarFile', request.AvatarFile);
    return await fetchWithAuth(`${apiUrl}/update-avatar`, {
      method: 'POST',
      body: formData,
    });
  };

  const getFriendsNotInGroup = async (groupId: string) => {
    return await fetchWithAuth(`${apiUrl}/${groupId}/non-members`);
  };

  const updateChatTheme = async (groupId: string, theme: string) => {
    const payload = { theme };
    return await fetchWithAuth(`${apiUrl}/${groupId}/update-chat-theme`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  return {
    createGroupChat,
    addGroupChatMember,
    deleteGroup,
    getGroupMembers,
    removeGroupMember,
    getUserGroupsWithDetails,
    renameGroup,
    updateGroupAdmin,
    revokeGroupAdmin,
    updateGroupAvatar,
    getFriendsNotInGroup,
    updateChatTheme,
  };
};

export default GroupService;
