const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add webp and lottie to assetExts if not present
if (!config.resolver.assetExts.includes("webp")) {
  config.resolver.assetExts.push("webp");
}
if (!config.resolver.assetExts.includes("lottie")) {
  config.resolver.assetExts.push("lottie");
}

const path = require('path');
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Exclude build outputs, cache, and metadata directories from Metro's file watcher to prevent EMFILE issues
const defaultBlockList = config.resolver.blockList;
const customBlockList = [
  new RegExp('^' + escapeRegExp(path.resolve(__dirname, 'dist')) + '.*'),
  new RegExp('^' + escapeRegExp(path.resolve(__dirname, 'dist_test')) + '.*'),
  new RegExp('^' + escapeRegExp(path.resolve(__dirname, '.git')) + '.*'),
  new RegExp('^' + escapeRegExp(path.resolve(__dirname, '.expo')) + '.*'),
  new RegExp('^' + escapeRegExp(path.resolve(__dirname, '.agents')) + '.*'),
  new RegExp('^' + escapeRegExp(path.resolve(__dirname, '.claude')) + '.*')
];

if (Array.isArray(defaultBlockList)) {
  config.resolver.blockList = [...defaultBlockList, ...customBlockList];
} else if (defaultBlockList instanceof RegExp) {
  config.resolver.blockList = [defaultBlockList, ...customBlockList];
} else {
  config.resolver.blockList = customBlockList;
}

module.exports = withNativeWind(config, { input: "./src/styles/globals.css" });

