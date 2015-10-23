import _ from 'lodash';

function mergeRules({rules, isDom = true}) {
  if (!_.isArray(rules) || !isDom) { return rules; }
  return _.merge({}, ...rules);
}

export default mergeRules;
