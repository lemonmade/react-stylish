import pxToRem from './px-to-rem';
import reactStyleSheet from './react-stylesheet';
import mergeRules from './merge-rules';

export const create = [
  pxToRem,
  reactStyleSheet,
];

export const attach = [
  mergeRules,
];

const Plugins = [
  ...create,
  ...attach,
];

export default Plugins;
