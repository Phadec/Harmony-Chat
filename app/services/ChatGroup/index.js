import axiosInstance, { baseURL } from "../axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
const ApiUrl = `${baseURL}/api/Groups`;

export class ChatGroupService {
// Lấy các mối quan hệ (bạn bè, nhóm)
async getRelationships() {
    const userId = await AsyncStorage.getItem('userId');
    try {
      const response = await axiosInstance.get(
        `${ApiUrl}/get-relationships`, {
          params: { userId: userId || '' },
        });

      if (response.data) {
        return response.data; // Trả về dữ liệu nhận được từ API
      }

      console.error('Get relationships failed:', response.data);
      return null;
    } catch (error) {
      console.error('Get relationships failed:', error.response ? error.response.data : error.message);
    }
  }

	// Gửi tin nhắn
	async sendMessage(recipientId, message, formData) {
		const userId = await AsyncStorage.getItem('userId');
		formData.append('UserId', userId || '');
		formData.append('RecipientId', recipientId || '');
		formData.append('Message', message || '');

		try {
		  console.log('Sending message with formData:', formData);
		  const response = await axiosInstance.post(
			`${baseURL}/api/Chats/send-message`, formData,
			{
			  headers: {
				'Content-Type': 'multipart/form-data',
			  },
			});

		  if (response.data) {
			return response.data; // Trả về dữ liệu nhận được từ API
		  }

		  console.error('Send message failed:', response.data);
		  return null;
		} catch (error) {
		  console.error('Send message failed:', error.response ? error.response.data : error.message);
		  throw error;
		}
	  }

	// Tạo nhóm chat
	async createGroupChat(nameGroup, memberIds, avatar) {
		const userId = await AsyncStorage.getItem('userId');
		try {
			const formData = new FormData();
			formData.append('Name', nameGroup || '');
			formData.append('MemberIds', memberIds || '');
			formData.append('Avatar', avatar || '');
			const reponse = await axiosInstance.post(
				`${ApiUrl}/create-group-chat`, formData, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				}
			);

			if (response.data) {
				return response.data; // Trả về dữ liệu nhận được từ API
			}

			console.error('Create chat failed:', response.data);
			return null;
		} catch(error) {
			console.log("Create chat group error:", error.response ? error.response.data : error.message);
		}
	}

	// Thêm thành viên vào nhóm chat
	async addGroupChatMember(groupId, userId) {
		try {
			const formData = new FormData();
			formData.append('GroupID', groupId || '');
			formData.append('UserId', userId || '');
			const response = await axiosInstance.post(
				`${ApiUrl}/add-group-chat-member`, formData, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				}
			);

			if (response.data) {
				return response.data; // Trả về dữ liệu nhận được từ API
			}

			console.error('Add member to group chat failed:', response.data);
			return null;
		} catch (error) {
			console.error('Add member to group chat failed:', error.response ? error.response.data : error.message);
		}
	}

	// Xóa nhóm chat
	async deleteGroup(groupId) {
		try {
			const response = await axiosInstance.delete(
				`${ApiUrl}/${groupId}/delete`
			);

			if (response.data) {
				return response.data; // Trả về dữ liệu nhận được từ API
			}

			console.error('Delete group chat failed:', response.data);
			return null;
		} catch (error) {
			console.error('Delete group chat failed:', error.response ? error.response.data : error.message);
		}
	}

	// Cập nhật chat theme
	async changeGroupAvatar(groupId) {
		try {
			const response = await axiosInstance.post(
				`${ApiUrl}/${groupId}/update-chat-theme`
			);

			if (response.data) {
				return response.data; // Trả về dữ liệu nhận được từ API
			}

			console.error('Update theme failed:', response.data);
			return null;
		} catch (error) {
			console.error('Update theme failed:', error.response ? error.response.data : error.message);
		}
	}

	// Lấy danh sách thành viên trong nhóm chat
	async getGroupMembers(groupId) {
		try {
			const response = await axiosInstance.get(
				`${ApiUrl}/${groupId}/members`
			);

			if (response.data) {
				return response.data; // Trả về dữ liệu nhận được từ API
			}

			console.error('Get group members failed:', response.data);
			return null;
		} catch (error) {
			console.error('Get group members failed:', error.response ? error.response.data : error.message);
		}
	}

	// Xóa thành viên khỏi nhóm chat
	async removeGroupMember(groupId, userId) {
		try {
			const formData = new FormData();
			formData.append('GroupID', groupId || '');
			formData.append('UserId', userId || '');
			const response = await axiosInstance.post(
				`${ApiUrl}/remove-member`, formData, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				}
			);

			if (response.data) {
				return response.data; // Trả về dữ liệu nhận được từ API
			}

			console.error('Remove member from group chat failed:', response.data);
			return null;
		} catch (error) {
			console.error('Remove member from group chat failed:', error.response ? error.response.data : error.message);
		}
	}

	// Lấy chi tiết thông tin người dùng trong chat
	async getUserGroupsWithDetails() {
		const userId = await AsyncStorage.getItem('userId');
		try {
			const response = await axiosInstance.get(
				`${ApiUrl}/user-groups-with-details/${userId}`
			);

			if (response.data) {
				return response.data; // Trả về dữ liệu nhận được từ API
			}

			console.error('Get user info failed:', response.data);
			return null;
		} catch (error) {
			console.error('Get user info failed:', error.response ? error.response.data : error.message);
		}
	}

	// Đổi tên nhóm
	async renameGroup(groupId, newName) {
		try {
			const response = await axiosInstance.put(
				`${ApiUrl}/rename-group`,
				{
					groupId: groupId,
					newName: newName,
				}
				, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				}
			);

			if (response.data) {
				return response.data; // Trả về dữ liệu nhận được từ API
			}

			console.error('Change group name failed:', response.data);
			return null;
		} catch (error) {
			console.error('Change group name failed:', error.response ? error.response.data : error.message);
		}
	}

	// Cập nhật admin
	async updateGroupAdmin(groupId, userId) {
		try {
			const formData = new FormData();
			formData.append('GroupId', groupId || '');
			formData.append('UserId', userId || '');
			const response = await axiosInstance.post(
				`${ApiUrl}/update-admin`,
				formData
				, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				}
			);

			if (response.data) {
				return response.data; // Trả về dữ liệu nhận được từ API
			}

			console.error('Update admin failed:', response.data);
			return null;
		} catch (error) {
			console.error('Update admin failed:', error.response ? error.response.data : error.message);
		}
	}

	// Thu hồi admin
	async revokeGroupAdmin(groupId, userId) {
		try {
			const formData = new FormData();
			formData.append('GroupId', groupId || '');
			formData.append('UserId', userId || '');
			const response = await axiosInstance.post(
				`${ApiUrl}/revoke-admin`,
				formData
				, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				}
			);

			if (response.data) {
				return response.data; // Trả về dữ liệu nhận được từ API
			}

			console.error('Revoke admin failed:', response.data);
			return null;
		} catch (error) {
			console.error('Revoke admin failed:', error.response ? error.response.data : error.message);
		}
	}

	// Cập nhật avatar
	async updateGroupAvatar(groupId, avatar) {
		try {
			const formData = new FormData();
			formData.append('GroupId', groupId || '');
			formData.append('AvatarFile', avatar || '');
			const response = await axiosInstance.post(
				`${ApiUrl}/update-avatar`,
				formData
				, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				}
			);

			if (response.data) {
				return response.data; // Trả về dữ liệu nhận được từ API
			}

			console.error('Update avatar failed:', response.data);
			return null;
		} catch (error) {
			console.error('Update avatar failed:', error.response ? error.response.data : error.message);
		}
	}

	// Lấy nhóm không có thành viên
	async getGroupsNonMember(groupId) {
		try {
			const response = await axiosInstance.get(
				`${ApiUrl}/${groupId}/non-members`, {
					groupId: groupId
				}, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				}
			);

			if (response.data) {
				return response.data; // Trả về dữ liệu nhận được từ API
			}

			console.error('Get group without members failed:', response.data);
			return null;
		} catch (error) {
			console.error('Get group without members failed:', error.response ? error.response.data : error.message);
		}
	}

	// Ẩn thông báo từ nhóm
	async muteGroupNotification(groupId) {
		try {
			const response = await axiosInstance.post(
				`${ApiUrl}/${groupId}/mute-group-notification`, {
					groupId: groupId
				}, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				}
			);

			if (response.data) {
				return response.data; // Trả về dữ liệu nhận được từ API
			}

			console.error('Hide notification failed:', response.data);
			return null;
		} catch (error) {
			console.error('Hide notification failed:', error.response ? error.response.data : error.message);
		}
	}
}
