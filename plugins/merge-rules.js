import _ from 'lodash';

function mergeRules({rules}) {
  if (!_.isArray(rules)) { return rules; }
  return _.merge({}, ...rules);
}

mergeRules.options = {react: 'dom', stage: 'attach'};

export default mergeRules;
