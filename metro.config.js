const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add webp to assetExts if not present
if (!config.resolver.assetExts.includes("webp")) {
  config.resolver.assetExts.push("webp");
}

// Exclude build outputs, cache, and metadata directories from Metro's file watcher to prevent EMFILE issues
const defaultBlockList = config.resolver.blockList;
const customBlockList = [
  /dist\/.*/,
  /dist_test\/.*/,
  /\.git\/.*/,
  /\.expo\/.*/,
  /\.agents\/.*/,
  /\.claude\/.*/
];

if (Array.isArray(defaultBlockList)) {
  config.resolver.blockList = [...defaultBlockList, ...customBlockList];
} else if (defaultBlockList instanceof RegExp) {
  config.resolver.blockList = [defaultBlockList, ...customBlockList];
} else {
  config.resolver.blockList = customBlockList;
}

module.exports = withNativeWind(config, { input: "./src/styles/globals.css" });

