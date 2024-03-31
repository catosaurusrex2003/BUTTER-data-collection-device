module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      require.resolve("expo-router/babel"),
      "nativewind/babel",
      'react-native-reanimated/plugin',
      // "module:react-native-dotenv"
    ],
  };
};