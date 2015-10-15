import pxToRem from './px-to-rem';
import mergeRules from './merge-rules';

export const create = [
  pxToRem,
];

export const attach = [
  mergeRules,
];

const Plugins = [
  ...create,
  ...attach,
];

export default Plugins;
