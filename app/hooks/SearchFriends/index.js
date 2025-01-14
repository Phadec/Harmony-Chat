	import {useCallback, useEffect, useRef, useState} from "react";

	// rxjs
	import {debounceTime, Subject} from "rxjs";
	import {distinctUntilChanged, shareReplay} from "rxjs/src";

	// Services
	import {UserService} from "@/services";

	function useSearchFriends() {
		const [friends, setFriends] = useState([]);
		const [searchTerm, setSearchTerm] = useState('');
		const [cachedResults, setCachedResults] = useState({});
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
					const searchResults = response.$values;
					setFriends(searchResults);

					// Lưu kết quả tìm kiếm vào cache
					setCachedResults((prevCache) => ({
						...prevCache,
						[query]: searchResults
					}));
				} catch (error) {
					console.error('Error searching friends:', error);
				} finally {
					setIsLoading(false);
				}
			});

			return () => subscription.unsubscribe();
		}, [cachedResults]);

		// Hàm search
		const handleSearch = useCallback((query) => {
			setSearchTerm(query);
			if (query.trim()) {
				searchSubject.current.next(query);
			} else {
				setFriends([]);
			}
		}, []);

		return { friends, setFriends, searchTerm, isLoading, handleSearch };
	}

	export default useSearchFriends;
