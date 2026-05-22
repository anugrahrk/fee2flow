module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      // ❌ Remove "nativewind/babel" — this is NativeWind v2 only
    ],
    plugins: [
      "react-native-reanimated/plugin",  // ✅ Add this — must be last
    ],
  };
};