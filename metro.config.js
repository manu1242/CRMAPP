const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add webp to assetExts if not present
if (!config.resolver.assetExts.includes("webp")) {
  config.resolver.assetExts.push("webp");
}

module.exports = withNativeWind(config, { input: "./src/styles/globals.css" });
