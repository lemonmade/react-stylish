import {isArray, merge} from '../common/utilities';

const MergeRulesPlugin = {
  attach(rules, {React}) {
    if (!isArray(rules) || !React.isDom) { return rules; }
    return merge({}, ...rules);
  },
};

export default MergeRulesPlugin;
