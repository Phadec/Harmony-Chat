import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import {View, Text, StatusBar} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useSelector, useDispatch} from 'react-redux';
import BottomSheet from '@gorhom/bottom-sheet';

// Navigations
import Navigation from '@/navigation';

// Containers
import {AddGroup, AddStory} from '@/containers';

// Components
import {CustomBackdrop} from '@/components';

// Commons
import {Colors} from '@/common';

// Actions
import {actions} from './redux/reducer/GroupRedux';

function Navigator() {
	const [isConnected, setIsConnected] = useState(true);

	// const {isOpenAddStory} = useSelector(state => state.story);
	const {isOpenAddGroup} = useSelector(state => state.group);

	const dispatch = useDispatch();

	useEffect(() => {
		// Only work in device
		const unsubNetState = NetInfo.addEventListener(state => {
			setIsConnected(state.isConnected);
		});

		return () => {
			unsubNetState();
		};
	}, []);

	// Bottom Sheet
	const bottomSheetRef = useRef(null);
	const snapPoints = useMemo(() => ['1%', '95%'], [isOpenAddGroup]);
	const handleSheetChanges = useCallback(index => {
		if (index === 0) {
			bottomSheetRef.current?.close();
			actions.setAddGroup(dispatch, false);
		}
	}, []);

	const renderBackdrop = useCallback(
		props => (
			<CustomBackdrop
				{...props}
				disappearsOnIndex={0}
				appearsOnIndex={1}
				onPress={() => {
					bottomSheetRef.current?.close();
					actions.setAddGroup(dispatch, false);
				}}
			/>
		),
		[],
	);

	return (
		<View className="flex-1 bg-white">
			<StatusBar barStyle="dark-content" animated />

			{!isConnected && (
				<View className="bg-orange h-[80] items-center justify-end pb-3">
					<Text className="font-rubik font-medium text-xs text-white">Check your internet connection.</Text>
				</View>
			)}

			<SafeAreaView className="flex-1">
				<Navigation />
			</SafeAreaView>

			{isOpenAddGroup && (
				<BottomSheet
					ref={bottomSheetRef}
					index={1}
					snapPoints={snapPoints}
					backgroundStyle={{
						backgroundColor: Colors.white,
					}}
					backdropComponent={renderBackdrop}
					onChange={handleSheetChanges}>
					<AddGroup />
				</BottomSheet>
			)}
		</View>
	);
}

export default Navigator;
