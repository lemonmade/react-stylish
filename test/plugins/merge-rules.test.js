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

    describe('options', () => {
      it('only applies to react DOM', () => {
        expect(mergeRules.options.react).to.equal('dom');
      });

      it('only applies in the create stage', () => {
        expect(mergeRules.options.stage).to.equal('attach');
      });
    });
  });
});
