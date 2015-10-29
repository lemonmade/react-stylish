import '../helper';
import ReactStyleSheetPlugin from '../../src/plugins/react-stylesheet';

describe('plugins', () => {
  describe('ReactStyleSheetPlugin', () => {
    const rule = Object.freeze({color: 'red'});
    let React;

    function reactStyleSheet(theRule, options = {}) {
      options.React = options.React || React;
      return ReactStyleSheetPlugin.create(theRule, options);
    }

    beforeEach(() => {
      React = {
        StyleSheet: {
          create: sinon.spy((rules) => {
            let newRules = {};
            Object.keys(rules).forEach((name) => newRules[name] = 1);
            return newRules;
          }),
        },

        isNative: true,
      };
    });

    it('returns the result of React.StyleSheet.create', () => {
      let result = reactStyleSheet(rule, {React});
      expect(result).to.equal(1);
    });

    it('does not apply if the rule is dynamic', () => {
      let result = reactStyleSheet(rule, {React, dynamic: true});
      expect(result).to.equal(rule);
    });

    it('does not apply if it is not React native', () => {
      React.isNative = false;
      let result = reactStyleSheet(rule, {React});
      expect(result).to.deep.equal(rule);
    });
  });
});
