import '../helper';
import StyleSheet from '../../common/StyleSheet';
import config from '../../common/config';

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

  describe('adding rules', () => {
    let reactComponent;
    const ruleOne = objectRule;
    const ruleTwo = Object.freeze({color: 'blue'});
    const INTERACTION_STATES = ['hover', 'focus', 'active'];

    function addCreatePlugin() {
      let plugin = sinon.stub().returns(ruleTwo);
      config.plugins.create = plugin;
    }

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

    beforeEach(() => {
      reactComponent = {props: {}, state: {}};
      stylesheet.attach(reactComponent);
      config.plugins.create = [];
    });

    describe('base rules', () => {
      it('returns an empty array for components without rules', () => {
        expect(stylesheet.for(component)).to.deep.equal([]);
      });

      it('does not throw when the context has no state', () => {
        delete reactComponent.state;
        expect(() => stylesheet.for(component)).to.not.throw;
      });

      it('does not throw when the context has no props', () => {
        delete reactComponent.props;
        expect(() => stylesheet.for(component)).to.not.throw;
      });

      it('returns an array of base object rules', () => {
        stylesheet.add({[component]: objectRule}, {base: true});
        expect(stylesheet.for(component)).to.deep.equal([objectRule]);
      });

      it('adds base rules passed in the constructor', () => {
        stylesheet = new StyleSheet({[component]: objectRule});
        expect(stylesheet.for(component)).to.deep.equal([objectRule]);
      });

      it('adds base styles as keys on the returned object', () => {
        stylesheet = new StyleSheet({[component]: objectRule});
        expect(stylesheet[component]).to.deep.equal([objectRule]);
      });

      it('only adds static base styles as keys on the returned object', () => {
        let augmentedBaseRules = {
          [component]: [
            objectRule,
            () => { return {transform: [{scale: 2}]}; },
          ],

          text() { return {color: 'blue'}; },
        };

        stylesheet = new StyleSheet(augmentedBaseRules);
        expect(stylesheet[component]).to.deep.equal([objectRule]);
        expect(stylesheet.text).to.be.empty;
      });

      it('returns an array of the result of base function rules', () => {
        stylesheet.add({[component]: functionRule}, {base: true});
        let result = stylesheet.for(component);
        let expected = [functionRuleResult];

        expect(result).to.deep.equal(expected);
        expect(functionRule).to.have.been.calledOn(reactComponent);
        expect(functionRule).to.have.been.calledWith(reactComponent);
      });

      it('returns an array of the result of base function and object rules', () => {
        stylesheet.add({[component]: [objectRule, functionRule]}, {base: true});
        let result = stylesheet.for(component);
        let expected = [objectRule, functionRuleResult];

        expect(result).to.deep.equal(expected);
        expect(functionRule).to.have.been.calledOn(reactComponent);
        expect(functionRule).to.have.been.calledWith(reactComponent);
      });

      it('allows number-based rules (for StyleSheet.create())', () => {
        stylesheet.add({[component]: 99}, {base: true});
        expect(stylesheet.for(component)).to.deep.equal([99]);
      });

      it('does not evaluate function rules when the context is not a React element', () => {
        let notReactComponent = {};
        stylesheet.attach(notReactComponent);
        stylesheet.add({[component]: [objectRule, functionRule]}, {base: true});

        let result = stylesheet.for(component);
        let expected = [objectRule];

        expect(result).to.deep.equal(expected);
        expect(functionRule).to.not.have.been.called;
      });

      it('applies the create plugins to static rules', () => {
        addCreatePlugin();
        stylesheet.add({[component]: objectRule}, {base: true});
        stylesheet.attach(reactComponent);
        expect(stylesheet.for(component)).to.deep.equal([ruleTwo]);
      });

      it('applies the create plugins to dynamic rules', () => {
        addCreatePlugin();
        stylesheet.add({[component]: functionRule}, {base: true});
        stylesheet.attach(reactComponent);
        expect(stylesheet.for(component)).to.deep.equal([ruleTwo]);
      });

      it('does not include interaction state rules in the base rule set', () => {
        ['hover', 'focus', 'active'].forEach((interactionState) => {
          stylesheet = new StyleSheet();
          stylesheet.add({[component]: {...ruleOne, [interactionState]: ruleTwo}}, {base: true});
          expect(stylesheet.for(component)).to.deep.equal([ruleOne]);
        });
      });
    });

    describe('variations', () => {
      it('returns variation styles for components without base styles', () => {
        addBooleanVariationRule(objectRule);
        reactComponent.state[booleanVariation] = true;

        let result = stylesheet.for(component);
        let expected = [objectRule];
        expect(result).to.deep.equal(expected);
      });

      it('puts multiple matching variation rules in the order they were defined', () => {
        stylesheet.add({
          [booleanVariation]: {[component]: ruleOne},
          [enumerableVariation]: {
            [enumerableVariationValue]: {[component]: ruleTwo},
          },
        });

        reactComponent.props[enumerableVariation] = enumerableVariationValue;
        reactComponent.props[booleanVariation] = true;

        let result = stylesheet.for(component);
        let expected = [ruleOne, ruleTwo];
        expect(result).to.deep.equal(expected);
      });

      it('applies the create plugins to static rules', () => {
        addCreatePlugin();
        stylesheet.add({[booleanVariation]: {[component]: objectRule}});
        reactComponent.props[booleanVariation] = true;
        stylesheet.attach(reactComponent);
        expect(stylesheet.for(component)).to.deep.equal([ruleTwo]);
      });

      it('applies the create plugins to dynamic rules', () => {
        addCreatePlugin();
        stylesheet.add({[booleanVariation]: {[component]: functionRule}});
        reactComponent.props[booleanVariation] = true;
        stylesheet.attach(reactComponent);
        expect(stylesheet.for(component)).to.deep.equal([ruleTwo]);
      });

      it('retrieves variation values from a passed variation mapping', () => {
        addBooleanVariationRule(objectRule);
        expect(stylesheet.for(component, {[booleanVariation]: true})).to.deep.equal([objectRule]);
      });

      it('uses the variation mapping value over the actual prop when both exist', () => {
        addEnumerableVariationRule(objectRule);
        let mapping = {[enumerableVariation]: enumerableVariationValue};
        reactComponent.props[enumerableVariation] = 'foo';
        expect(stylesheet.for(component, mapping)).to.deep.equal([objectRule]);
      });

      it('does not get confused when the variation mapping returns a falsey value', () => {
        addBooleanVariationRule(objectRule);
        let mapping = {[booleanVariation]: false};
        reactComponent.props[booleanVariation] = true;
        expect(stylesheet.for(component, mapping)).to.be.empty;
      });

      it('does not include interaction state rules in the base rule set', () => {
        ['hover', 'focus', 'active'].forEach((interactionState) => {
          addBooleanVariationRule({...ruleOne, [interactionState]: ruleTwo});
          reactComponent.props[booleanVariation] = true;
          expect(stylesheet.for(component)).to.deep.equal([ruleOne]);
        });
      });

      describe('boolean variations', () => {
        it('does not retrieve styles for a falsey boolean variation', () => {
          addBooleanVariationRule([objectRule, functionRule]);
          reactComponent.props[booleanVariation] = false;
          expect(stylesheet.for(component)).to.deep.equal([]);
        });

        it('retrieves object style rules for a true boolean variation', () => {
          addBooleanVariationRule(objectRule);
          reactComponent.props[booleanVariation] = true;
          expect(stylesheet.for(component)).to.deep.equal([objectRule]);
        });

        it('retrieves object style rules for a truthy variation', () => {
          addBooleanVariationRule(objectRule);

          let booleanVariationTruthyValue = {foo: 'bar'};
          reactComponent.props[booleanVariation] = booleanVariationTruthyValue;

          let result = stylesheet.for(component);
          let expected = [objectRule];
          expect(result).to.deep.equal(expected);
        });

        it('retrieves the result of function style rules for a true boolean variation', () => {
          addBooleanVariationRule(functionRule);

          reactComponent.props[booleanVariation] = true;

          let result = stylesheet.for(component);
          let expected = [functionRuleResult];

          expect(result).to.deep.equal(expected);
          expect(functionRule).to.have.been.calledOn(reactComponent);
          expect(functionRule).to.have.been.calledWith(reactComponent);
        });

        it('retrieves the result of function style rules for a truthy boolean variation', () => {
          addBooleanVariationRule(functionRule);

          let booleanVariationTruthyValue = {foo: 'bar'};
          reactComponent.props[booleanVariation] = booleanVariationTruthyValue;

          let result = stylesheet.for(component);
          let expected = [functionRuleResult];

          expect(result).to.deep.equal(expected);
          expect(functionRule).to.have.been.calledOn(reactComponent);
          expect(functionRule).to.have.been.calledWith(reactComponent);
        });

        it('retrieves an array style rules for a truthy boolean variation', () => {
          addBooleanVariationRule([objectRule, functionRule]);
          reactComponent.props[booleanVariation] = true;

          let result = stylesheet.for(component);
          let expected = [objectRule, functionRuleResult];

          expect(result).to.deep.equal(expected);
          expect(functionRule).to.have.been.calledOn(reactComponent);
          expect(functionRule).to.have.been.calledWith(reactComponent);
        });

        it('does not get confused by transform declarations of a boolean variation', () => {
          let rule = {transform: [{scale: 2}]};
          addBooleanVariationRule(rule);
          reactComponent.props[booleanVariation] = true;
          expect(stylesheet.for(component)).to.deep.equal([rule]);
        });

        INTERACTION_STATES.forEach((state) => {
          it(`does not get confused by ${state} declarations of a boolean variation`, () => {
            let rule = {[state]: objectRule};
            addBooleanVariationRule(rule);
            reactComponent.props[booleanVariation] = true;
            expect(stylesheet.for(component)).to.be.empty;
          });
        });
      });

      describe('enumerable variations', () => {
        it('does not retrieve styles for a non-matching enumerable prop', () => {
          addEnumerableVariationRule(objectRule, functionRule);
          reactComponent.props[enumerableVariation] = 'foo';

          let result = stylesheet.for(component);
          let expected = [];

          expect(result).to.deep.equal(expected);
          expect(functionRule).to.not.have.been.called;
        });

        it('retrieves object style rules for a matching enumerable prop', () => {
          addEnumerableVariationRule(objectRule);
          reactComponent.props[enumerableVariation] = enumerableVariationValue;

          let result = stylesheet.for(component);
          let expected = [objectRule];
          expect(result).to.deep.equal(expected);
        });

        it('retrieves the result of function style rules for a matching enumerable prop', () => {
          addEnumerableVariationRule(functionRule);
          reactComponent.props[enumerableVariation] = enumerableVariationValue;

          let result = stylesheet.for(component);
          let expected = [functionRuleResult];

          expect(result).to.deep.equal(expected);
          expect(functionRule).to.have.been.calledOn(reactComponent);
          expect(functionRule).to.have.been.calledWith(reactComponent);
        });

        it('retrieves an array style rules for a matching enumerable prop', () => {
          addEnumerableVariationRule([objectRule, functionRule]);
          reactComponent.props[enumerableVariation] = enumerableVariationValue;

          let result = stylesheet.for(component);
          let expected = [objectRule, functionRuleResult];

          expect(result).to.deep.equal(expected);
          expect(functionRule).to.have.been.calledOn(reactComponent);
          expect(functionRule).to.have.been.calledWith(reactComponent);
        });
      });
    });

    describe('interactions', () => {
      it('has empty interaction styles for a component with base rules', () => {
        stylesheet.add({[component]: ruleOne}, {base: true});
        expect(stylesheet.interactions[component]).to.deep.equal({});
      });

      it('has empty interaction styles for a component with variation rules', () => {
        addBooleanVariationRule(objectRule);
        expect(stylesheet.interactions[component]).to.deep.equal({});
      });

      INTERACTION_STATES.forEach((state) => {
        const OTHER_STATES = INTERACTION_STATES.filter((otherState) => otherState !== state);

        it(`it sets the ${state} state when passed as part of the base rules`, () => {
          stylesheet.add({[component]: {[state]: ruleTwo}}, {base: true});
          expect(stylesheet.interactions[component]).to.be.defined;
          expect(stylesheet.interactions[component][state]).to.be.true;

          OTHER_STATES.forEach((otherState) => {
            expect(stylesheet.interactions[component][otherState]).to.not.be.true;
          });
        });

        it(`it sets the ${state} state when passed as part of the boolean variation rules`, () => {
          addBooleanVariationRule({[state]: ruleTwo});
          expect(stylesheet.interactions[component]).to.be.defined;
          expect(stylesheet.interactions[component][state]).to.be.true;

          OTHER_STATES.forEach((otherState) => {
            expect(stylesheet.interactions[component][otherState]).to.not.be.true;
          });
        });

        it(`it sets the ${state} state when passed as part of the enumerable variation rules`, () => {
          addEnumerableVariationRule({[state]: ruleTwo});
          expect(stylesheet.interactions[component]).to.be.defined;
          expect(stylesheet.interactions[component][state]).to.be.true;

          OTHER_STATES.forEach((otherState) => {
            expect(stylesheet.interactions[component][otherState]).to.not.be.true;
          });
        });

        it(`includes ${state} styles when the ${state} state key for the component is true`, () => {
          stylesheet.base({[component]: {[state]: objectRule}});
          reactComponent.state._StylishState = {[state]: {[component]: true}};
          expect(stylesheet.for(component)).to.deep.equal([objectRule]);
        });

        it(`includes ${state} styles in the correct order`, () => {
          let otherState = OTHER_STATES[0];
          stylesheet.base({[component]: {[state]: ruleOne, [otherState]: ruleTwo}});
          reactComponent.state._StylishState = {
            [state]: {[component]: true},
            [otherState]: {[component]: true},
          };

          expect(stylesheet.for(component)).to.deep.equal([ruleOne, ruleTwo]);
        });

        it(`does not include ${state} styles when the ${state} state key for the component is false`, () => {
          stylesheet.base({[component]: {[state]: objectRule}});
          reactComponent.state._StylishState = {[state]: {[component]: false}};
          expect(stylesheet.for(component)).to.be.empty;
        });

        it(`includes variation ${state} styles when the ${state} state key for the component is true`, () => {
          addBooleanVariationRule({[state]: objectRule});
          reactComponent.state._StylishState = {[state]: {[component]: true}};
          reactComponent.props[booleanVariation] = true;
          expect(stylesheet.for(component)).to.deep.equal([objectRule]);
        });

        it(`does not include variation ${state} styles when the ${state} state key for the component is false`, () => {
          addBooleanVariationRule({[state]: objectRule});
          reactComponent.state._StylishState = {[state]: {[component]: false}};
          reactComponent.props[booleanVariation] = true;
          expect(stylesheet.for(component)).to.be.empty;
        });

        it(`does not include variation ${state} styles when the variation does not apply`, () => {
          addBooleanVariationRule({[state]: objectRule});
          reactComponent.state._StylishState = {[state]: {[component]: true}};
          addBooleanVariationRule({[state]: objectRule});
          expect(stylesheet.for(component)).to.be.empty;
        });

        it(`includes variation ${state} styles in the correct order`, () => {
          let otherState = OTHER_STATES[0];
          addBooleanVariationRule({[state]: ruleOne, [otherState]: ruleTwo});
          reactComponent.props[booleanVariation] = true;
          reactComponent.state._StylishState = {
            [state]: {[component]: true},
            [otherState]: {[component]: true},
          };

          expect(stylesheet.for(component)).to.deep.equal([ruleOne, ruleTwo]);
        });
      });

      it('does not overwrite existing interaction records', () => {
        stylesheet.add({[component]: {hover: ruleOne}}, {base: true});
        expect(stylesheet.interactions[component]).to.deep.equal({hover: true});

        addBooleanVariationRule({active: ruleTwo});
        expect(stylesheet.interactions[component]).to.deep.equal({
          hover: true,
          active: true,
        });
      });
    });
  });

  describe('#base', () => {
    it('calls #add with the base option', () => {
      sinon.stub(stylesheet, 'add').returns('foo');
      let baseRule = {[component]: objectRule};
      let result = stylesheet.base(baseRule);

      expect(stylesheet.add).to.have.been.calledWith(baseRule, {base: true});
      expect(result).to.equal('foo');
    });
  });

  describe('#variations', () => {
    it('calls #add', () => {
      sinon.stub(stylesheet, 'add').returns('foo');
      let variationRule = {[booleanVariation]: {[component]: objectRule}};
      let result = stylesheet.variations(variationRule);

      expect(stylesheet.add).to.have.been.calledWith(variationRule);
      expect(result).to.equal('foo');
    });
  });

  describe('#variation', () => {
    it('calls #add with a formatted version of the variation', () => {
      sinon.stub(stylesheet, 'add').returns('foo');
      let variationRule = {[component]: objectRule};
      let result = stylesheet.variation(booleanVariation, variationRule);

      expect(stylesheet.add).to.have.been.calledWith({[booleanVariation]: variationRule});
      expect(result).to.equal('foo');
    });
  });

  describe('#attach', () => {
    it('sets the new object as the context for the rules', () => {
      let context = {props: {}, state: {}};
      stylesheet.attach(context);
      expect(stylesheet.context).to.equal(context);
    });
  });
});
