module.exports = {
	presets: ['module:metro-react-native-babel-preset'],
	plugins: [
		'react-native-reanimated/plugin',
		['nativewind/babel', {tailwindConfig: './tailwind.config.js'}],
		[
			'module-resolver',
			{
				root: ['.'],
				extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
				alias: {
					'@': './app',
				},
			},
		],
	],
};
