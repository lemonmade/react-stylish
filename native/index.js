import React from 'react-native';

import connect from './connect';
import Plugins from '../plugins';

import create from '../common/create';
import config from '../common/config';

config.React.use(React, {native: true});

export {
  connect,
  create,
  Plugins,
};

const Stylish = {
  connect,
  create,
  Plugins,
};

export default Stylish;
