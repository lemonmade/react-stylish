import {isNumber} from '../common/utilities';

const DEFAULT_EXCLUDES = {
  borderBottomWidth: true,
  borderLeftWidth: true,
  borderRightWidth: true,
  borderTopWidth: true,
  borderWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  columnCount: true,
  fillOpacity: true,
  flex: true,
  flexGrow: true,
  flexNegative: true,
  flexPositive: true,
  flexShrink: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  strokeDashoffset: true,
  strokeOpacity: true,
  strokeWidth: true,
  tabSize: true,
  textStrokeWidth: true,
  widows: true,
  zIndex: true,
  zoom: true,
};

const PxToRemPlugin = {
  create(rule, {React, excluding = {}}) {
    if (!React.isDom) { return rule; }

    Object.keys(rule).forEach((ruleName) => {
      let val = rule[ruleName];

      if (
        !val ||
        !isNumber(val) ||
        excluding[ruleName] ||
        DEFAULT_EXCLUDES[ruleName]
      ) { return; }

      rule[ruleName] = `${val / 16}rem`;
    });

    return rule;
  },

  excluding(...excluding) {
    let excluded = {};
    excluding.forEach((exclude) => excluded[exclude] = true);

    return {
      create(rule, options) {
        options.excluding = excluded;
        return PxToRemPlugin.create(rule, options);
      },
    };
  },
};

export default PxToRemPlugin;
