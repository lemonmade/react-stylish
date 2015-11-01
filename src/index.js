import {connect, create, configure} from './common';
import * as Plugins from './plugins';
import createContainerQuery from '../src/plugins/container-queries/create';
import React from './react';

configure({
  React,
  plugins: [
    Plugins.VendorPrefix,
    Plugins.ContainerQueries,
    Plugins.InteractionStyles,
    Plugins.MergeRules,
  ],
});

const ContainerQueries = {create: createContainerQuery};

export {
  connect,
  create,
  configure,
  Plugins,
  ContainerQueries,
  ContainerQueries as CQ,
};

const Stylish = {
  connect,
  create,
  configure,
  Plugins,
  ContainerQueries,
  CQ: ContainerQueries,
};

export default Stylish;
