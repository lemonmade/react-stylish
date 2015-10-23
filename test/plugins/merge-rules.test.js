import '../helper';
import mergeRules from '../../plugins/merge-rules';

describe('plugins', () => {
  describe('mergeRules', () => {
    it('returns the rule if it is not an array', () => {
      let rules = {color: 'red'};
      let result = mergeRules({rules});
      expect(result).to.equal(rules);
    });

    it('merges an array of rules', () => {
      let rules = [{color: 'red'}, {backgroundColor: 'blue'}, {color: 'orange'}];
      let result = mergeRules({rules});
      expect(result).to.deep.equal({color: 'orange', backgroundColor: 'blue'});
    });

    it('only applies to React DOM', () => {
      let rules = [{color: 'red'}, {backgroundColor: 'blue'}, {color: 'orange'}];
      let rulesCopy = [...rules];
      let result = mergeRules({rules, isDom: false});
      expect(result).to.deep.equal(rulesCopy);
    });
  });
});
