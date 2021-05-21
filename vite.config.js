const vuePlugin = require('@vitejs/plugin-vue');
const vueJsx = require('@vitejs/plugin-vue-jsx');
const svgLoader = require('vite-svg-loader');

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  plugins: [
    vuePlugin(),
    vueJsx(),
    svgLoader(),
  ],
  build: {
    minify: false,
  },
};
