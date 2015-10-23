import '../helper';
import reactStyleSheet from '../../plugins/react-stylesheet';

let React = {
  StyleSheet: {
    create: sinon.spy((rules) => {
      let newRules = {};
      Object.keys(rules).forEach((name) => newRules[name] = 1);
      return newRules;
    }),
  },
};

describe('plugins', () => {
  describe('reactStyleSheet', () => {
    const rule = Object.freeze({color: 'red'});

    it('returns the result of React.StyleSheet.create', () => {
      let result = reactStyleSheet({rule, React});
      expect(result).to.equal(1);
    });

    it('does not apply if the rule is dynamic', () => {
      let result = reactStyleSheet({rule, React, dynamic: true});
      expect(result).to.equal(rule);
    });

    it('does not apply if it is not React native', () => {
      let result = reactStyleSheet({rule, React, isNative: false});
      expect(result).to.deep.equal(rule);
    });
  });
});
