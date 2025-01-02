import {useState} from "react";

// Services
import {FriendService, UserService} from "@/services";


const useFriendSearchActions = (initialState) => {
	const [friendState, setFriendState] = useState(initialState);
	const friendService = new FriendService();
	const userService = new UserService();

	// Add friend
	const addFriend = async (friendId, query) => {
		try {
			const response = await friendService.addFriend(friendId);
			if (response) {
				// Gọi lại API tìm kiếm để cập nhật danh sách
				const updatedFriends = await userService.searchFriends(query); // Gọi lại searchFriends
				const updatedFriend = updatedFriends.$values
					.find(f => f.id === friendId);

				if (updatedFriend) {
					setFriendState({
						...friendState,
						hasSentRequest: true,
						requestId: updatedFriend.requestId, // Lấy requestId từ kết quả tìm kiếm mới
					});
				} else {
					// Nếu không tìm thấy bạn trong danh sách tìm kiếm
					setFriendState({
						...friendState,
						hasSentRequest: true,
					});
				}
			}
		} catch (error) {
			console.error("Error adding friend:", error);
		}
	};

	// Cancel request
	const cancelRequest = async (requestId) => {
		try {
			const response = await friendService.cancelFriendRequest(requestId);
			if (response) {
				console.log("Request canceled successfully");
				setFriendState({...friendState,hasSentRequest: false});
			}
		} catch (error) {
			console.error("Error canceling request :", error);
		}
	};

	// Accept request
	const acceptRequest = async (requestId) => {
		try {
			const friendService = new FriendService();
			const response = await friendService.acceptFriendRequest(requestId);
			if (response) {
				console.log("Request accepted successfully");
				setFriendState({...friendState, hasReceivedRequest: false});
			}
		} catch (error) {
			console.error("Error accepting request:", error);
		}
	}

	// Reject request
	const rejectRequest = async (requestId) => {
		try {
			const response = await friendService.rejectRequest(requestId);
			if (response) {
				console.log("Request rejected successfully");
				setFriendState({...friendState, hasReceivedRequest: false});
			}
		} catch (error) {
			console.error("Error rejecting request:", error);
		}
	};

	return {
		friendState,
		addFriend,
		cancelRequest,
		acceptRequest,
		rejectRequest,
	};
}

export default useFriendSearchActions;
