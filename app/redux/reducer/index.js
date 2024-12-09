import {combineReducers} from 'redux';

import {reducer as AppReducer} from './AppRedux';
import {reducer as StoryRedux} from './StoryRedux';

export default combineReducers({
	app: AppReducer,
	story: StoryRedux,
});
