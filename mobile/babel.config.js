module.exports = function (api) {
	api.cache(true);

	return {
		// `worklets: false` desactiva el plugin que babel-preset-expo agrega solo,
		// para declararlo explícitamente al final como exige Reanimated 4.
		presets: [["babel-preset-expo", { worklets: false }]],
		plugins: ["react-native-worklets/plugin"],
	};
};
