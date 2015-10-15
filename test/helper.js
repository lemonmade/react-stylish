import config from '../common/config';

let createPlugins;
let attachPlugins;

beforeEach(() => {
  createPlugins = config.plugins.create;
  attachPlugins = config.plugins.attach;
});

afterEach(() => {
  config.plugins.create = createPlugins;
  config.plugins.attach = attachPlugins;
});
