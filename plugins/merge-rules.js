import _ from 'lodash';

const MergeRulesPlugin = {
  attach(rules, {React}) {
    if (!_.isArray(rules) || !React.isDom) { return rules; }
    return _.merge({}, ...rules);
  },
};

export default MergeRulesPlugin;
