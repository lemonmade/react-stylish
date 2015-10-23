import React from 'react';

import connect from './connect';
import Plugins from '../plugins';

import create from '../common/create';
import config from '../common/config';

config.React.use(React, {dom: true});

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
