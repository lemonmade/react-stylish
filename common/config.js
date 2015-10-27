// Default options and global configuration

import _ from 'lodash';

const DEFAULTS = Object.freeze({
  React: null,
  identifier: 'styled',
  depth: 'smart',
  pseudo: false,
  plugins: [],
});

let config = {};

export function configure(newConfig) {
  _.assign(config, newConfig);
}

configure.defaults = function() {
  Object.keys(config).forEach((key) => delete config[key]);
  configure(DEFAULTS);
};

configure.defaults();

export default config;
