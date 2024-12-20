/**
 * @format
 */

import {gestureHandlerRootHOC} from 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import 'react-native-url-polyfill/auto'; // Tự động polyfill URL

AppRegistry.registerComponent(appName, () => gestureHandlerRootHOC(App));
