import {connect, create, configure} from './common';
import * as Plugins from './plugins';
import React from './react';

configure({
  React,
  plugins: [
    Plugins.VendorPrefix,
    Plugins.InteractionStyles,
    Plugins.PositionalStyles,
    Plugins.MergeRules,
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
