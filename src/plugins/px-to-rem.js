import {isNumber} from '../common/utilities';

const DEFAULT_EXCLUDES = [
  'borderWidth',
  'borderTopWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderRightWidth',
  'textStrokeWidth',
];

const PxToRemPlugin = {
  create(rule, {React, excluding = []}) {
    if (!React.isDom) { return rule; }

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
  },

  excluding(...excluding) {
    return {
      create(rule, options) {
        options.excluding = excluding;
        return PxToRemPlugin.create(rule, options);
      },
    };
  },
};

export default PxToRemPlugin;
