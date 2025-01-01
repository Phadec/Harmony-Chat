import {useCallback, useEffect, useRef, useState} from "react";

// rxjs
import {debounceTime, Subject} from "rxjs";

// Services
import {UserService} from "../../services/Users";
import {distinctUntilChanged, shareReplay} from "rxjs/src";


function useSearchFriends() {
	const [friends, setFriends] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const searchSubject = useRef(new Subject());
	const userService = useRef(new UserService()); // Tránh tạo mới instance

	// Sử dụng useEffect để tạo subscription cho searchSubject
	useEffect(() => {
		const subscription = searchSubject.current.pipe(
			debounceTime(300),
			distinctUntilChanged(),
			shareReplay(1)
		).subscribe(async (query) => {
			if (!query.trim()) {
				setFriends([]);
				return;
			}

			setIsLoading(true);
			try {
				const response = await userService.current.searchFriends(query);
				setFriends(response.$values);
			} catch (error) {
				console.error('Error searching friends:', error);
			} finally {
				setIsLoading(false);
			}
		});

		return () => subscription.unsubscribe();
	}, []);

	// Hàm search
	const handleSearch = useCallback((query) => {
		setSearchTerm(query);
		searchSubject.current.next(query);
	}, []);

	return { friends, searchTerm, isLoading, handleSearch };
}

export default useSearchFriends;
