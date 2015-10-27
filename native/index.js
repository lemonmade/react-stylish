import React from './react';

import connect from '../common/connect';
import create from '../common/create';
import {configure} from '../common/config';

import {Plugins} from '../plugins';

configure({React});

export {
  connect,
  create,
  configure,
  Plugins,
};

const Stylish = {
  connect,
  create,
  configure,
  Plugins,
};

export default Stylish;
