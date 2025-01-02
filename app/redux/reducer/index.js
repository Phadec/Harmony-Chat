import {combineReducers} from 'redux';

import {reducer as AppReducer} from './AppRedux';
import {reducer as StoryRedux} from './StoryRedux';
import {reducer as GroupRedux} from './GroupRedux';
import {reducer as FriendRedux} from './FriendRedux';

export default combineReducers({
	app: AppReducer,
	story: StoryRedux,
	group: GroupRedux,
	friend: FriendRedux,
});
