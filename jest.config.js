/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  testRegex: "__tests__/.*\\.test\\.js$",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.(js|jsx)$": ["babel-jest", { presets: ["@babel/preset-env", ["@babel/preset-react", { runtime: "automatic" }]] }],
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(framer-motion|howler|@uidotdev)/)",
  ],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.js"],
};
