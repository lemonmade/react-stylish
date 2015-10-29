import {connect, create, configure} from './common';
import * as Plugins from './plugins';
import React from './react/native';

configure({
  React,
  plugins: [
    Plugins.ReactStyleSheet,
    Plugins.PositionalStyles,
  ],
});

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
