import { useState, useEffect } from 'react';

interface AppConfigService {
  getBaseUrl(): string;
}

interface FriendsServiceProps {
  appConfig: AppConfigService;
}

const FriendsService = ({ appConfig }: FriendsServiceProps) => {
  const apiUrl = `${appConfig.getBaseUrl()}/api/Friends`;

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    // You can modify this to include authentication headers if needed
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  };

  const getSentFriendRequests = async (userId: string) => {
    return await fetchWithAuth(`${apiUrl}/${userId}/get-sent-friend-requests`);
  };

  const changeNickname = async (userId: string, friendId: string, nickname: string) => {
    const payload = { FriendId: friendId, Nickname: nickname };
    return await fetchWithAuth(`${apiUrl}/${userId}/change-nickname`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  const addFriend = async (userId: string, friendId: string) => {
    return await fetchWithAuth(`${apiUrl}/${userId}/add/${friendId}`, {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  const removeFriend = async (userId: string, friendId: string) => {
    return await fetchWithAuth(`${apiUrl}/${userId}/remove/${friendId}`, {
      method: 'DELETE',
    });
  };

  const getFriends = async (userId: string) => {
    return await fetchWithAuth(`${apiUrl}/${userId}/friends`);
  };

  const getFriendRequests = async (userId: string) => {
    return await fetchWithAuth(`${apiUrl}/${userId}/friend-requests`);
  };

  const acceptFriendRequest = async (userId: string, requestId: string) => {
    return await fetchWithAuth(`${apiUrl}/${userId}/accept-friend-request/${requestId}`, {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  const rejectFriendRequest = async (userId: string, requestId: string) => {
    return await fetchWithAuth(`${apiUrl}/${userId}/reject-friend-request/${requestId}`, {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  const cancelFriendRequest = async (userId: string, requestId: string) => {
    return await fetchWithAuth(`${apiUrl}/${userId}/cancel-friend-request/${requestId}`, {
      method: 'DELETE',
    });
  };

  const blockUser = async (userId: string, blockedUserId: string) => {
    return await fetchWithAuth(`${apiUrl}/${userId}/block/${blockedUserId}`, {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  const unblockUser = async (userId: string, blockedUserId: string) => {
    return await fetchWithAuth(`${apiUrl}/${userId}/unblock/${blockedUserId}`, {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  const getBlockedUsers = async (userId: string) => {
    return await fetchWithAuth(`${apiUrl}/${userId}/blocked-users`);
  };

  const getFriendInfo = async (userId: string, entityId: string) => {
    return await fetchWithAuth(`${apiUrl}/${userId}/relationship-info/${entityId}`);
  };

  const updateChatTheme = async (userId: string, friendId: string, theme: string) => {
    const payload = { theme };
    return await fetchWithAuth(`${apiUrl}/${userId}/update-chat-theme/${friendId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  return {
    getSentFriendRequests,
    changeNickname,
    addFriend,
    removeFriend,
    getFriends,
    getFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    blockUser,
    unblockUser,
    getBlockedUsers,
    getFriendInfo,
    updateChatTheme,
  };
};

export default FriendsService;
