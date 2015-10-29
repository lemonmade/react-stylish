// Default options and global configuration

const DEFAULTS = Object.freeze({
  React: null,
  identifier: 'styled',
  depth: 'smart',
  pseudo: false,
  plugins: [],
});

let config = {};

export function configure(newConfig) {
  Object.keys(newConfig).forEach((key) => config[key] = newConfig[key]);
}

configure.defaults = function() {
  Object.keys(config).forEach((key) => delete config[key]);
  return configure(DEFAULTS);
};

configure.addPlugins = function(...plugins) {
  return configure({plugins: [...config.plugins, ...plugins]});
};

configure.defaults();

export default config;
