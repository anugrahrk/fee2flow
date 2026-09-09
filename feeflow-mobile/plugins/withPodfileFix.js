const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withPodfileFix(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile");
      if (fs.existsSync(podfilePath)) {
        let content = fs.readFileSync(podfilePath, "utf8");
        if (!content.includes("['fmt', 'RCT-Folly'].include?(target.name)")) {
          const targetSnippet = `    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        if ['fmt', 'RCT-Folly'].include?(target.name)
          config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
        end
      end
    end`;
          content = content.replace(
            /(react_native_post_install\([\s\S]*?\)\s*\n)/,
            `$1${targetSnippet}\n`
          );
          fs.writeFileSync(podfilePath, content);
        }
      }
      return config;
    },
  ]);
};
