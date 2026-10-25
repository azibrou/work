import tokenSavePlugin from './tokenSavePlugin.js';
import { generateStories } from './generateStories.js';

// Pages and Components/Cards are named after the top navigation, so their
// story files are written before Storybook reads the stories.
generateStories();

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp"
  ],
  "framework": "@storybook/react-vite",
  viteFinal(viteConfig) {
    viteConfig.plugins = [...(viteConfig.plugins ?? []), tokenSavePlugin()];
    return viteConfig;
  },
};
export default config;
