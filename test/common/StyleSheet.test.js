import '../helper';
import StyleSheet from '../../common/StyleSheet';
import config, {configure} from '../../common/config';

describe('StyleSheet', () => {
  const component = 'button';
  const enumerableVariation = 'type';
  const enumerableVariationValue = 'primary';
  const booleanVariation = 'active';
  const objectRule = Object.freeze({color: 'red'});
  const functionRuleResult = Object.freeze({backgroundColor: 'white'});
  const functionRule = sinon.stub().returns(functionRuleResult);
  let stylesheet;

  beforeEach(() => {
    stylesheet = new StyleSheet();
    functionRule.reset();
  });

  describe('#add', () => {
    const ruleOne = objectRule;
    const ruleTwo = Object.freeze({color: 'blue'});

    function addBooleanVariationRule(rule) {
      stylesheet.add({[booleanVariation]: {[component]: rule}});
    }

    function addEnumerableVariationRule(rule) {
      stylesheet.add({
        [enumerableVariation]: {
          [enumerableVariationValue]: {[component]: rule},
        },
      });
    }

    describe('when base', () => {
      it('stores base rules', () => {
        stylesheet.add({[component]: objectRule}, {base: true});
        let {rules} = stylesheet;
        expect(rules[component].base.base).to.deep.equal([objectRule]);
      });

      it('stores a number rule', () => {
        stylesheet.add({[component]: 42}, {base: true});
        let {rules} = stylesheet;
        expect(rules[component].base.base).to.deep.equal([42]);
      });

      it('stores a wrapped function rule', () => {
        stylesheet.add({[component]: functionRule}, {base: true});

        let {rules} = stylesheet;
        let rule = rules[component].base.base[0];
        expect(rule).to.be.a('function');

        let context = {};
        let result = rule(context);
        expect(functionRule).to.have.been.calledWith(context);
        expect(result).to.equal(functionRuleResult);
      });

      it('stores arrays of rules', () => {
        stylesheet.add({[component]: [objectRule, functionRule]}, {base: true});

        let {rules} = stylesheet;
        let rule = rules[component].base.base;

        expect(rule[0]).to.equal(objectRule);
        expect(rule[1]()).to.equal(functionRuleResult);
      });
    });

    describe('when variation', () => {
      it('stores boolean variations', () => {
        addBooleanVariationRule(objectRule);

        let {rules, variationDetails} = stylesheet;
        expect(rules[component][booleanVariation].true.base).to.deep.equal([objectRule]);
        expect(variationDetails[booleanVariation]).to.have.property('isBoolean', true);
      });

      it('stores enumerable variations', () => {
        addEnumerableVariationRule(objectRule);

        let {rules, variationDetails} = stylesheet;
        expect(rules[component][enumerableVariation][enumerableVariationValue].base).to.deep.equal([objectRule]);
        expect(variationDetails[enumerableVariation]).to.have.property('isBoolean', false);
      });

      it('stores variations for multiple components', () => {
        addBooleanVariationRule(ruleOne);
        stylesheet.add({[booleanVariation]: {text: ruleTwo}});

        let {rules} = stylesheet;
        expect(rules[component][booleanVariation].true.base).to.deep.equal([ruleOne]);
        expect(rules.text[booleanVariation].true.base).to.deep.equal([ruleTwo]);
      });

      it('stores multiple enumerable variation values', () => {
        addEnumerableVariationRule(ruleOne);
        stylesheet.add({[enumerableVariation]: {secondary: {[component]: ruleTwo}}});

        let {rules} = stylesheet;
        expect(rules[component][enumerableVariation][enumerableVariationValue].base).to.deep.equal([ruleOne]);
        expect(rules[component][enumerableVariation].secondary.base).to.deep.equal([ruleTwo]);
      });

      it('does not get confused by transform rules in boolean variations', () => {
        addBooleanVariationRule({transform: {scale: 2}});
        let {variationDetails} = stylesheet;
        expect(variationDetails[booleanVariation]).to.have.property('isBoolean', true);
      });

      it('does not get confused by arrays of boolean rules', () => {
        addBooleanVariationRule([objectRule]);
        let {variationDetails} = stylesheet;
        expect(variationDetails[booleanVariation]).to.have.property('isBoolean', true);
      });

      it('does not get confused by a function boolean rule', () => {
        addBooleanVariationRule(() => objectRule);
        let {variationDetails} = stylesheet;
        expect(variationDetails[booleanVariation]).to.have.property('isBoolean', true);
      });

      it('does not get confused by keys reserved by plugins in boolean variations', () => {
        let plugin = {reserve: sinon.spy((key) => key === 'hover')};
        configure({plugins: [plugin]});
        addBooleanVariationRule({hover: objectRule});

        let {variationDetails} = stylesheet;
        expect(variationDetails[booleanVariation]).to.have.property('isBoolean', true);
      });
    });

    describe('with plugins', () => {
      const key = 'hover';
      let pluginOne = null;
      let pluginTwo = null;

      describe('reserve', () => {
        beforeEach(() => {
          pluginOne = {reserve: sinon.spy(() => false)};
          pluginTwo = {reserve: sinon.spy((styleKey) => styleKey === key)};
        });

        it('calls plugins to check if an object key is reserved', () => {
          configure({plugins: [pluginOne, pluginTwo]});
          addBooleanVariationRule({[key]: objectRule});

          let pluginOneArgs = pluginOne.reserve.lastCall.args;
          let pluginTwoArgs = pluginTwo.reserve.lastCall.args;
          let expectedOptions = {pseudo: config.pseudo};

          expect(pluginOneArgs[0]).to.equal(key);
          expect(pluginOneArgs[1]).to.equal(objectRule);
          expect(pluginOneArgs[2]).to.deep.equal(expectedOptions);
          expect(pluginTwoArgs[0]).to.equal(key);
          expect(pluginTwoArgs[1]).to.equal(objectRule);
          expect(pluginTwoArgs[2]).to.deep.equal(expectedOptions);
        });

        it('does not call plugins if a previous plugin has reserved a key', () => {
          configure({plugins: [pluginTwo, pluginOne]});
          addBooleanVariationRule({[key]: objectRule});
          expect(pluginOne.reserve).not.to.have.been.calledWith(key);
          expect(pluginTwo.reserve).to.have.been.calledWith(key);
        });
      });

      describe('add', () => {
        beforeEach(() => {
          pluginOne = {
            add: sinon.spy((rule) => {
              let {hover, ...base} = rule;
              return {hover, base};
            }),
          };

          pluginTwo = {
            add: sinon.spy((rule) => {
              let {focus, ...base} = rule;
              return {focus, base};
            }),
          };

          configure({plugins: [pluginOne, pluginTwo]});
        });

        it('extracts parts of rules based on add plugins', () => {
          stylesheet.add({[component]: {hover: ruleOne, focus: ruleTwo, ...ruleOne}}, {base: true});
          let {rules} = stylesheet;

          expect(rules[component].base).to.deep.equal({
            base: [ruleOne],
            hover: [ruleOne],
            focus: [ruleTwo],
          });
        });
      });

      describe('create', () => {
        beforeEach(() => {
          pluginOne = {create: sinon.stub().returns(42)};
          pluginTwo = {create: sinon.stub().returns(43)};
          configure({plugins: [pluginOne, pluginTwo]});
        });

        it('calls create plugins on object rules and stores the result', () => {
          stylesheet.add({[component]: objectRule}, {base: true});

          let {rules} = stylesheet;
          let expectedOptions = {dynamic: false, React: config.React};

          let pluginOneArgs = pluginOne.create.lastCall.args;
          let pluginTwoArgs = pluginTwo.create.lastCall.args;

          expect(pluginOneArgs[0]).to.equal(objectRule);
          expect(pluginOneArgs[1]).to.deep.equal(expectedOptions);
          expect(pluginTwoArgs[0]).to.equal(42);
          expect(pluginTwoArgs[1]).to.deep.equal(expectedOptions);
          expect(rules[component].base.base).to.deep.equal([43]);
        });

        it('calls create plugins on the result of function-wrapped rules', () => {
          stylesheet.add({[component]: functionRule}, {base: true});

          let {rules} = stylesheet;
          let result = rules[component].base.base[0]();
          let expectedOptions = {dynamic: true, React: config.React};

          let pluginOneArgs = pluginOne.create.lastCall.args;
          let pluginTwoArgs = pluginTwo.create.lastCall.args;

          expect(pluginOneArgs[0]).to.equal(functionRuleResult);
          expect(pluginOneArgs[1]).to.deep.equal(expectedOptions);
          expect(pluginTwoArgs[0]).to.equal(42);
          expect(pluginTwoArgs[1]).to.deep.equal(expectedOptions);
          expect(result).to.equal(43);
        });
      });
    });
  });

  describe('#base', () => {
    it('calls #add with the base option', () => {
      sinon.stub(stylesheet, 'add').returns(stylesheet);
      let baseRule = {[component]: objectRule};
      let result = stylesheet.base(baseRule);

      expect(stylesheet.add).to.have.been.calledWith(baseRule, {base: true});
      expect(result).to.equal(stylesheet);
    });
  });

  describe('#variations', () => {
    it('calls #add', () => {
      sinon.stub(stylesheet, 'add').returns(stylesheet);
      let variationRule = {[booleanVariation]: {[component]: objectRule}};
      let result = stylesheet.variations(variationRule);

      expect(stylesheet.add).to.have.been.calledWith(variationRule);
      expect(result).to.equal(stylesheet);
    });
  });

  describe('#variation', () => {
    it('calls #add with a formatted version of the variation', () => {
      sinon.stub(stylesheet, 'add').returns(stylesheet);
      let variationRule = {[component]: objectRule};
      let result = stylesheet.variation(booleanVariation, variationRule);

      expect(stylesheet.add).to.have.been.calledWith({[booleanVariation]: variationRule});
      expect(result).to.equal(stylesheet);
    });
  });

  describe('#id', () => {
    it('gives a unique ID to each stylesheet', () => {
      expect(new StyleSheet().id).to.not.equal(new StyleSheet().id);
    });
  });
});
