import '../helper';
import _ from 'lodash';
import PositionalStylesPlugin from '../../plugins/positional-styles';

describe('plugins', () => {
  describe('PositionalStylesPlugin', () => {
    const POSITIONAL_STATES = ['first', 'last', 'even', 'odd'];
    const positionalRule = Object.freeze({background: 'gray'});
    const regularRule = Object.freeze({background: 'white'});

    describe('.reserve', () => {
      POSITIONAL_STATES.forEach((state) => {
        it(`reserves '${state}' rules`, () => {
          expect(PositionalStylesPlugin.reserve(state, positionalRule)).to.be.true;
        });

        it(`reserves ':${state}' rules in pseudo mode`, () => {
          expect(PositionalStylesPlugin.reserve(`:${state}`, positionalRule, {pseudo: true})).to.be.true;
        });

        it(`does not reserve '${state}' rules in pseudo mode`, () => {
          expect(PositionalStylesPlugin.reserve(state, positionalRule, {pseudo: true})).to.be.false;
        });
      });

      it('does not reserve other rules', () => {
        expect(PositionalStylesPlugin.reserve('backgroundColor', 'red')).to.be.false;
      });
    });

    describe('.add', () => {
      POSITIONAL_STATES.forEach((state) => {
        it(`extracts '${state}' rules`, () => {
          let rule = {...regularRule, [state]: positionalRule};
          let expected = {base: regularRule, [state]: positionalRule};
          let result = PositionalStylesPlugin.add(rule);

          expect(result).to.deep.equal(expected);
        });

        it(`extracts ':${state}' rules in pseudo mode`, () => {
          let rule = {...regularRule, [`:${state}`]: positionalRule};
          let expected = {base: regularRule, [state]: positionalRule};
          let result = PositionalStylesPlugin.add(rule, {pseudo: true});

          expect(result).to.deep.equal(expected);
        });
      });
    });

    describe('.add', () => {
      POSITIONAL_STATES.forEach((state) => {
        it(`Extracts '${state}' rules`, () => {
          let rule = {...regularRule, [state]: positionalRule};
          let expected = {base: regularRule, [state]: positionalRule};
          expect(PositionalStylesPlugin.add(rule)).to.deep.equal(expected);
        });
      });
    });

    describe('.resolve', () => {
      const React = {
        Children: {
          count(children) {
            if (_.isArray(children)) { return children.length; }
            return 1;
          },
        },
      };

      function parentWithNChildren(count) {
        let children = [];
        let parent = {props: {children}};
        for (let i = 0; i < count; i++) { children.push({}); }
        return parent;
      }

      function resolve(rules, options = {}) {
        options.React = React;
        return PositionalStylesPlugin.resolve(rules, options);
      }

      describe('when first', () => {
        it('does not add a rule when first but no rules exist', () => {
          let rules = {base: regularRule};
          let result = resolve(rules, {index: 0});
          expect(result).to.be.empty;
        });

        it('does not add a rule when there is a rule but the child is not first', () => {
          let rules = {base: regularRule, first: positionalRule};
          let result = resolve(rules, {index: 1, parent: parentWithNChildren(2)});
          expect(result).to.be.empty;
        });

        it('adds a rule when there is a rule and the child is first', () => {
          let rules = {base: regularRule, first: positionalRule};
          let result = resolve(rules, {index: 0, parent: parentWithNChildren(1)});
          expect(result).to.deep.equal([positionalRule]);
        });

        it('adds a rule when there is a rule and the child is the root', () => {
          let rules = {base: regularRule, first: positionalRule};
          let result = resolve(rules, {index: 0});
          expect(result).to.deep.equal([positionalRule]);
        });
      });

      describe('when last', () => {
        it('does not add a rule when last but no rules exist', () => {
          let rules = {base: regularRule};
          let result = resolve(rules, {index: 0});
          expect(result).to.be.empty;
        });

        it('does not add a rule when there is a rule but the child is not last', () => {
          let rules = {base: regularRule, last: positionalRule};
          let result = resolve(rules, {index: 1, parent: parentWithNChildren(3)});
          expect(result).to.be.empty;
        });

        it('adds a rule when there is a rule and the child is last', () => {
          let rules = {base: regularRule, last: positionalRule};
          let result = resolve(rules, {index: 1, parent: parentWithNChildren(2)});
          expect(result).to.deep.equal([positionalRule]);
        });

        it('adds a rule when there is a rule and the child is the root', () => {
          let rules = {base: regularRule, last: positionalRule};
          let result = resolve(rules, {index: 0});
          expect(result).to.deep.equal([positionalRule]);
        });
      });

      describe('when even', () => {
        it('does not add a rule when even but no rules exist', () => {
          let rules = {base: regularRule};
          let result = resolve(rules, {index: 1, parent: parentWithNChildren(4)});
          expect(result).to.be.empty;
        });

        it('does not add a rule when there is a rule but the child is not even', () => {
          let rules = {base: regularRule, even: positionalRule};
          let result = resolve(rules, {index: 2, parent: parentWithNChildren(4)});
          expect(result).to.be.empty;
        });

        it('adds a rule when there is a rule and the child is even', () => {
          let rules = {base: regularRule, even: positionalRule};
          let result = resolve(rules, {index: 1, parent: parentWithNChildren(4)});
          expect(result).to.deep.equal([positionalRule]);
        });
      });

      describe('when odd', () => {
        it('does not add a rule when odd but no rules exist', () => {
          let rules = {base: regularRule};
          let result = resolve(rules, {index: 2, parent: parentWithNChildren(4)});
          expect(result).to.be.empty;
        });

        it('does not add a rule when there is a rule but the child is not odd', () => {
          let rules = {base: regularRule, odd: positionalRule};
          let result = resolve(rules, {index: 1, parent: parentWithNChildren(4)});
          expect(result).to.be.empty;
        });

        it('adds a rule when there is a rule and the child is odd', () => {
          let rules = {base: regularRule, odd: positionalRule};
          let result = resolve(rules, {index: 2, parent: parentWithNChildren(4)});
          expect(result).to.deep.equal([positionalRule]);
        });
      });
    });
  });
});
