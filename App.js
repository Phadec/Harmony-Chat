import React from 'react';
import {Provider} from 'react-redux';
import 'react-native-url-polyfill/auto'; // Tự động polyfill URL
// Store
import store from '@/redux/store';

// Navigations
import Navigator from '@/navigator';
import {MenuProvider} from "react-native-popup-menu";
import { AuthProvider } from './app/contexts/AuthContext';

if (__DEV__) {
	const ignoreWarns = ['VirtualizedLists should never be nested inside plain ScrollViews'];

	const errorWarn = global.console.error;
	global.console.error = (...arg) => {
		for (const error of ignoreWarns) {
			if (arg[0].startsWith(error)) {
				return;
			}
		}
		errorWarn(...arg);
	};
}

function App() {

	return (
		<Provider store={store}>
			<MenuProvider>
				<AuthProvider>
					<Navigator/>
				</AuthProvider>
			</MenuProvider>
		</Provider>
	);
}

export default App;
