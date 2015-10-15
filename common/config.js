import * as _ from './utilities';
import {create, attach} from '../plugins';

const plugins = {
  create,
  attach,
};

const config = {
  plugins: {
    set create(newPlugins) {
      plugins.create = _.asArray(newPlugins);
      return plugins.create;
    },

    set attach(newPlugins) {
      plugins.attach = _.asArray(newPlugins);
      return plugins.attach;
    },

    get create() { return plugins.create; },
    get attach() { return plugins.attach; },
  },

  identifier: 'styled',
  depth: 'smart',
};

export default config;
