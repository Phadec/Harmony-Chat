import React, {useState, useEffect, useRef} from 'react';
import {View, FlatList,} from 'react-native';
import {useFocusEffect} from "@react-navigation/native";

// Components
import {Header, GroupCard} from '@/components';

// Layout
import Layout from '@/Layout';

// Service
import {SignalRService} from "../../services/signalR";
import {GroupService} from "@/services";

// Redux
import {actions} from "@/redux/reducer/GroupRedux";
import {useDispatch, useSelector} from "react-redux";


function GroupsContainer({navigation}) {
	const {groups} = useSelector(state => state.group);
	const dispatch = useDispatch();

	useEffect(() => {
		actions.fetchGroups(dispatch, new GroupService());
	}, [dispatch]);

	return (
		<Layout>
			<Header title="Groups" groups navigation={navigation}/>
			<View className="flex-1 mt-6">
				<FlatList
					data={groups}
					keyExtractor={item => item.id}
					renderItem={({item}) => (
						<GroupCard
							group={item}
							navigation={navigation}
							index={groups.indexOf(item)}
							totalItems={groups.length}
						/>
					)}
					showsVerticalScrollIndicator={false}
				/>
			</View>
		</Layout>
	);
}

export default GroupsContainer;
