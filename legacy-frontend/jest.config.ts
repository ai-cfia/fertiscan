import nextJest from "next/jest";

const createJestConfig = nextJest({
  dir: "./", // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  coverageProvider: "v8",
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    swiper: "identity-obj-proxy",
    "\\.(css|less|scss|sss|styl)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);
