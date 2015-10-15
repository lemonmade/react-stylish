import {isNumber} from '../common/utilities';

const DEFAULT_EXCLUDES = [
  'borderWidth',
  'borderTopWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderRightWidth',
  'textStrokeWidth',
];

export default function pxToRem({rule, excluding = []}) {
  Object.keys(rule).forEach((ruleName) => {
    let val = rule[ruleName];

    if (
      !isNumber(val) ||
      excluding.indexOf(ruleName) >= 0 ||
      DEFAULT_EXCLUDES.indexOf(ruleName) >= 0
    ) { return; }

    rule[ruleName] = `${val / 16}rem`;
  });

  return rule;
}

pxToRem.options = {react: 'dom', stage: 'create'};

pxToRem.excluding = function(...excluding) {
  return function(options) {
    options.excluding = excluding;
    return pxToRem(options);
  };
};