import StyleSheet from './StyleSheet';
import config from './config';

function create(...args) {
  return new StyleSheet(...args);
}

create.use = function({plugins}) {
  config.plugins.create = plugins;
};

export default create;
