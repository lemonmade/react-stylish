import '../helper';

import React from 'react';
import resolve from '../../common/resolve';
import config, {configure} from '../../common/config';
import StyleSheet from '../../common/StyleSheet';
import _ from 'lodash';

describe('resolve', () => {
  const ruleOne = Object.freeze({backgroundColor: 'red'});
  const ruleTwo = Object.freeze({backgroundColor: 'blue'});

  let result;
  let context;
  let stylesheet;

  class CustomComponent extends React.Component {
    static propTypes = {children: React.PropTypes.node};

    constructor(props) { super(props); this.state = {}; }
    render() { return this.props.children; }
  }

  function nestedChild(element) {
    let child = React.Children.only(element.props.children);
    while (child && child.props && !child.props.styled && child.props.children) {
      child = React.Children.only(child.props.children);
    }

    return child;
  }

  beforeEach(() => {
    React.isCustomComponent = () => false;
    configure({React});
    context = new CustomComponent({});

    stylesheet = new StyleSheet({
      root: ruleOne,
      nested: ruleTwo,
    });
  });

  it('adds styles to the root element', () => {
    result = resolve(<div styled="root" />, context, stylesheet);
    expect(result.props.style).to.deep.equal([ruleOne]);
  });

  it('adds styles to nested elements', () => {
    result = resolve(<div styled="root"><div styled="nested" /></div>, context, stylesheet);
    let nested = nestedChild(result);

    expect(result.props.style).to.deep.equal([ruleOne]);
    expect(nested.props.style).to.deep.equal([ruleTwo]);
  });

  it('handles non-element children', () => {
    result = resolve(<div>{"not a React element!"}<div styled="nested" /></div>, context, stylesheet);

    React.Children.forEach(result.props.children, (nested) => {
      if (!React.isValidElement(nested)) { return; }
      expect(nested.props.style).to.deep.equal([ruleTwo]);
    });
  });

  it('does not add styles to nested elements with the attribute but without styles', () => {
    result = resolve(<div><div styled="noStyles" /></div>, context, stylesheet);
    let nested = nestedChild(result);
    expect(nested.props.style).to.be.undefined;
  });

  it('allows function-wrapped elements to be stylized', () => {
    result = resolve(() => { return <div styled="root"><div styled="nested" /></div>; }, context, stylesheet)();
    let nested = nestedChild(result);

    expect(result.props.style).to.deep.equal([ruleOne]);
    expect(nested.props.style).to.deep.equal([ruleTwo]);
  });

  it('allows function-wrapped children elements to be stylized', () => {
    class FunctionRenderer extends React.Component {
      static propTypes = {children: React.PropTypes.func};
      render() { return this.props.children(); }
    }

    result = resolve(<FunctionRenderer>{() => <div styled="nested" />}</FunctionRenderer>, context, stylesheet);
    let nested = result.props.children();
    expect(nested.props.style).to.deep.equal([ruleTwo]);
  });

  it('does not choke on function-wrapped elements that return a string', () => {
    result = resolve(() => { return 'foo'; }, context, stylesheet)();
    expect(result).to.equal('foo');
  });

  it('merges an already-present style on the element, with the existing style taking precedence', () => {
    let customStyle = {backgroundColor: 'purple'};
    result = resolve(<div style={customStyle} styled="root" />, context, stylesheet);
    expect(result.props.style).to.deep.equal([ruleOne, customStyle]);
  });

  it('calls function rules with the context and stores their result', () => {
    let functionRule = sinon.spy(() => ruleOne);
    stylesheet = new StyleSheet({root: functionRule});
    result = resolve(<div styled="root" />, context, stylesheet);

    expect(functionRule).to.have.been.calledWith(context);
    expect(functionRule).to.have.been.calledOn(context);
    expect(result.props.style).to.deep.equal([ruleOne]);
  });

  it('does not do anything special with number rules', () => {
    const numberRule = 42;
    stylesheet = new StyleSheet({root: numberRule});
    result = resolve(<div styled="root" />, context, stylesheet);
    expect(result.props.style).to.deep.equal([numberRule]);
  });

  it('merges an already-present array of styles on the element, with the existing styles taking precedence', () => {
    let customStyle = [{backgroundColor: 'purple'}, {backgroundColor: 'orange'}];
    result = resolve(<div style={customStyle} styled="root" />, context, stylesheet);
    expect(result.props.style).to.deep.equal([ruleOne, ...customStyle]);
  });

  it('attaches styles from multiple styled strings', () => {
    result = resolve(<div styled="root nested" />, context, stylesheet);
    expect(result.props.style).to.deep.equal([ruleOne, ruleTwo]);
  });

  it('ignores identifier strings that do not have rules', () => {
    result = resolve(<div styled="root foo" />, context, stylesheet);
    expect(result.props.style).to.deep.equal([ruleOne]);
  });

  it('does not clone a node that has no extra styles', () => {
    sinon.stub(React, 'cloneElement');
    resolve(<div styled="foo" />, context, stylesheet);
    expect(React.cloneElement).not.to.have.been.called;
    React.cloneElement.restore();
  });

  describe('with variations', () => {
    describe('boolean variations', () => {
      const booleanVariation = 'primary';
      let rendered;

      function addBooleanVariation(rule = ruleOne) {
        stylesheet.variation(booleanVariation, {root: rule});
      }

      beforeEach(() => {
        stylesheet = new StyleSheet();
        rendered = <div styled="root" />;
      });

      ['state', 'props'].forEach((attribute) => {
        it(`selects boolean variations when the ${attribute} value is true`, () => {
          addBooleanVariation();
          context = {[attribute]: {[booleanVariation]: true}};
          result = resolve(rendered, context, stylesheet);
          expect(result.props.style).to.deep.equal([ruleOne]);
        });

        it(`selects boolean variations when the ${attribute} value is truthy`, () => {
          addBooleanVariation();
          context = {[attribute]: {[booleanVariation]: 'foo'}};
          result = resolve(rendered, context, stylesheet);
          expect(result.props.style).to.deep.equal([ruleOne]);
        });

        it(`does not select boolean variations when the ${attribute} value is false`, () => {
          addBooleanVariation();
          context = {[attribute]: {[booleanVariation]: false}};
          result = resolve(rendered, context, stylesheet);
          expect(result.props.style).to.be.undefined;
        });
      });

      it('uses a false state value over a true prop value', () => {
        addBooleanVariation();
        context = {state: {[booleanVariation]: false}, props: {[booleanVariation]: true}};
        result = resolve(rendered, context, stylesheet);
        expect(result.props.style).to.be.undefined;
      });

      it('uses a true state value over a false prop value', () => {
        addBooleanVariation();
        context = {state: {[booleanVariation]: true}, props: {[booleanVariation]: false}};
        result = resolve(rendered, context, stylesheet);
        expect(result.props.style).to.deep.equal([ruleOne]);
      });

      it('calls function rules with the context and stores their result', () => {
        let functionRule = sinon.spy(() => ruleOne);
        addBooleanVariation(functionRule);
        context = {props: {[booleanVariation]: true}};
        result = resolve(<div styled="root" />, context, stylesheet);

        expect(functionRule).to.have.been.calledWith(context);
        expect(functionRule).to.have.been.calledOn(context);
        expect(result.props.style).to.deep.equal([ruleOne]);
      });

      it('does not do anything special with number rules', () => {
        const numberRule = 42;
        addBooleanVariation(numberRule);
        context = {props: {[booleanVariation]: true}};
        result = resolve(<div styled="root" />, context, stylesheet);
        expect(result.props.style).to.deep.equal([numberRule]);
      });

      it('does nothing for a variation without prop or state values', () => {
        addBooleanVariation();
        result = resolve(<div styled="root" />, context, stylesheet);
        expect(result.props.style).to.be.undefined;
      });
    });

    describe('enumerable variations', () => {
      const enumerableVariation = 'type';
      const enumerableVariationValue = 'primary';
      let rendered;

      function addEnumerableVariation(rule = ruleOne) {
        stylesheet.variation(enumerableVariation, {[enumerableVariationValue]: {root: rule}});
      }

      beforeEach(() => {
        stylesheet = new StyleSheet();
        rendered = <div styled="root" />;
      });

      ['state', 'props'].forEach((attribute) => {
        it(`selects enumerable variations when the ${attribute} value matches`, () => {
          addEnumerableVariation();
          context = {[attribute]: {[enumerableVariation]: enumerableVariationValue}};
          result = resolve(rendered, context, stylesheet);
          expect(result.props.style).to.deep.equal([ruleOne]);
        });

        it(`does not select enumerable variations when the ${attribute} value does not match`, () => {
          addEnumerableVariation();
          context = {[attribute]: {[enumerableVariation]: 'foo'}};
          result = resolve(rendered, context, stylesheet);
          expect(result.props.style).to.be.undefined;
        });
      });

      it('uses a matching state value over a non-matching prop value', () => {
        addEnumerableVariation();
        context = {
          state: {[enumerableVariation]: enumerableVariationValue},
          props: {[enumerableVariation]: 'foo'},
        };
        result = resolve(rendered, context, stylesheet);
        expect(result.props.style).to.deep.equal([ruleOne]);
      });

      it('uses a non-matching state value over a matching prop value', () => {
        addEnumerableVariation();
        context = {
          state: {[enumerableVariation]: 'foo'},
          props: {[enumerableVariation]: enumerableVariationValue},
        };
        result = resolve(rendered, context, stylesheet);
        expect(result.props.style).to.be.undefined;
      });

      it('calls function rules with the context and stores their result', () => {
        let functionRule = sinon.spy(() => ruleOne);
        addEnumerableVariation(functionRule);
        context = {props: {[enumerableVariation]: enumerableVariationValue}};
        result = resolve(<div styled="root" />, context, stylesheet);

        expect(functionRule).to.have.been.calledWith(context);
        expect(functionRule).to.have.been.calledOn(context);
        expect(result.props.style).to.deep.equal([ruleOne]);
      });

      it('does not do anything special with number rules', () => {
        // Can't add number variation rules directly for enumerable variations
        const numberRule = 42;
        addEnumerableVariation([numberRule]);
        context = {props: {[enumerableVariation]: enumerableVariationValue}};
        result = resolve(<div styled="root" />, context, stylesheet);
        expect(result.props.style).to.deep.equal([numberRule]);
      });
    });
  });

  describe('with options', () => {
    describe('with identifier', () => {
      it('allows you to pass a custom identifier prop', () => {
        result = resolve(<div is="root"><div styled="nested" /></div>, context, stylesheet, {identifier: 'is'});
        let nested = nestedChild(result);

        expect(result.props.style).to.deep.equal([ruleOne]);
        expect(nested.props.style).to.be.undefined;
      });
    });

    describe('with depth', () => {
      beforeEach(() => {
        React.isCustomComponent = (element) => element.type === CustomComponent;
      });

      it('adds styles to non-custom-elements of any depth', () => {
        let deeplyNested = (
          <div><div><div><div><div><div><div><div>
            <div styled="nested" />
          </div></div></div></div></div></div></div></div>
        );

        result = resolve(deeplyNested, context, stylesheet);
        let nested = nestedChild(result);
        expect(nested.props.style).to.deep.equal([ruleTwo]);
      });

      it('does not add styles when React.isCustomComponent is true', () => {
        result = resolve(<CustomComponent><div styled="nested" /></CustomComponent>, context, stylesheet);
        let nested = nestedChild(result);
        expect(nested.props.style).to.be.undefined;
      });

      it('adds styles to components within custom components when depth is false', () => {
        result = resolve(<CustomComponent><div styled="nested" /></CustomComponent>, context, stylesheet, {depth: false});
        let nested = nestedChild(result);
        expect(nested.props.style).to.deep.equal([ruleTwo]);
      });

      it('adds styles to components within custom components when depth is an integer', () => {
        result = resolve(<CustomComponent><div styled="nested" /></CustomComponent>, context, stylesheet, {depth: 3});
        let nested = nestedChild(result);
        expect(nested.props.style).to.deep.equal([ruleTwo]);
      });

      it('does not go below the specified depth in resolving styles', () => {
        let deeplyNested = (
          <div><div><div><div><div><div><div><div>
            <div styled="nested" />
          </div></div></div></div></div></div></div></div>
        );

        result = resolve(deeplyNested, context, stylesheet, {depth: 3});
        let nested = nestedChild(result);
        expect(nested.props.style).to.be.undefined;
      });
    });

    describe('with variation mapping', () => {
      const variation = 'primary';
      let mapper;

      beforeEach(() => {
        mapper = sinon.spy(() => { return {[variation]: true}; });
      });

      it('calls the mapper with the context', () => {
        resolve(<div />, context, stylesheet, {variationMapping: mapper});
        expect(mapper).to.have.been.calledWith(context);
      });

      it('uses the variation mapper for resolving styles', () => {
        stylesheet = new StyleSheet();
        stylesheet.variation(variation, {root: ruleOne});
        context = {state: {[variation]: false}};
        result = resolve(<div styled="root" />, context, stylesheet, {variationMapping: mapper});

        expect(result.props.style).to.deep.equal([ruleOne]);
      });

      it('does not use the variation mapper for unrelated variations', () => {
        stylesheet = new StyleSheet();
        mapper = sinon.spy(() => { return {foo: false}; });
        stylesheet.variation(variation, {root: ruleOne});
        context = {state: {[variation]: true}};
        result = resolve(<div styled="root" />, context, stylesheet, {variationMapping: mapper});

        expect(result.props.style).to.deep.equal([ruleOne]);
      });
    });
  });

  describe('with resolve plugins', () => {
    function createPlugin(func = () => {}) {
      let plugin = {resolve: sinon.spy(func)};
      configure({plugins: [plugin]});
      return plugin;
    }

    beforeEach(() => {
      stylesheet.base({root: ruleOne});
    });

    it('calls resolve plugins with the correct arguments', () => {
      let element = <div styled="root" />;
      let plugin = createPlugin();

      resolve(element, context, stylesheet);

      expect(plugin.resolve).to.have.been.calledWith(stylesheet.rules.root.base, {
        stylesheet,
        React: config.React,
        context,
        element,
        stylishState: {},
        component: 'root',
        parent: null,
        index: 0,
      });
    });

    it('calls resolve plugins for variations', () => {
      let element = <div styled="root" />;
      let plugin = createPlugin();
      stylesheet = new StyleSheet();
      stylesheet.variation('primary', {root: ruleOne});
      context = {props: {primary: true}};

      resolve(element, context, stylesheet);

      expect(plugin.resolve).to.have.been.calledWith(stylesheet.rules.root.primary.true, {
        stylesheet,
        React: config.React,
        context,
        element,
        stylishState: {},
        component: 'root',
        parent: null,
        index: 0,
      });
    });

    it('calls the resolve plugins with the correct index and parent', () => {
      let element = <div><div /><div /><div styled="nested" /></div>;
      let plugin = createPlugin();

      resolve(element, context, stylesheet);
      let nested = element.props.children[2];
      let pluginOptions = plugin.resolve.lastCall.args[1];

      expect(pluginOptions).to.have.property('index', 2);
      expect(pluginOptions).to.have.property('parent', element);
      expect(pluginOptions).to.have.property('element', nested);
    });

    it('calls the resolve plugins with the stylishState', () => {
      let plugin = createPlugin();
      let stylishState = {foo: true};
      context = {state: {stylishState}};

      resolve(<div styled="root" />, context, stylesheet);
      let pluginOptions = plugin.resolve.lastCall.args[1];

      expect(pluginOptions).to.have.property('stylishState', stylishState);
    });

    it('includes rules returned from resolve plugins', () => {
      createPlugin(() => ruleTwo);
      result = resolve(<div styled="root" />, context, stylesheet);
      expect(result.props.style).to.deep.equal([ruleOne, ruleTwo]);
    });
  });

  describe('with augment plugins', () => {
    function createPlugin(func = () => {}) {
      let plugin = {augment: sinon.spy(func)};
      configure({plugins: [plugin]});
      return plugin;
    }

    it('gets called with the correct arguments', () => {
      let plugin = createPlugin();
      let props = {styled: 'root', foo: true};
      let element = React.createElement('div', props);

      resolve(element, context, stylesheet);
      let augmentArgs = plugin.augment.lastCall.args;
      let augmentOptions = augmentArgs[1];

      expect(augmentArgs[0]).to.deep.equal(props);
      expect(augmentOptions.component).to.equal('root');
      expect(augmentOptions.context).to.deep.equal(context);
      expect(augmentOptions.element).to.deep.equal(element);
      expect(augmentOptions.index).to.equal(0);
      expect(augmentOptions.parent).to.be.null;
      expect(augmentOptions.React).to.deep.equal(config.React);
      expect(augmentOptions.stylesheet).to.deep.equal(stylesheet);
      expect(augmentOptions.stylishState).to.deep.equal({});

      expect(augmentOptions.setState).to.be.a('function');
    });

    it('provides a setState method that updates the stylishState', () => {
      let plugin = createPlugin();
      let setStateSpy = sinon.spy();
      let originalState = {foo: true};
      context = {setState: setStateSpy, state: {stylishState: originalState}};
      resolve(<div styled="root" />, context, stylesheet);

      let {setState} = plugin.augment.lastCall.args[1];
      let newState = {bar: true};
      setState(newState);
      expect(setStateSpy).to.have.been.calledWith({stylishState: {foo: true, bar: true}});
    });

    it('merges new props added by the plugin', () => {
      let newProps = {bar: true};
      createPlugin(() => newProps);
      result = resolve(<div styled="root" />, context, stylesheet);
      expect(result.props).to.have.property('bar', true);
    });

    it('calls plugins for each identifier', () => {
      let fooProps = {foo: true};
      let barProps = {bar: true};
      let calledComponents = [];

      createPlugin((props, {component}) => {
        calledComponents.push(component);
        return component === 'foo' ? fooProps : barProps;
      });

      result = resolve(<div styled="foo bar" />, context, stylesheet);

      expect(calledComponents).to.deep.equal(['foo', 'bar']);
      expect(result.props).to.have.property('foo', true);
      expect(result.props).to.have.property('bar', true);
    });

    it('merges new props added by the plugin when no styles are added', () => {
      let newProps = {bar: true};
      createPlugin(() => newProps);
      result = resolve(<div styled="noStyles" />, context, stylesheet);
      expect(result.props).to.have.property('bar', true);
    });

    it('does not clone the element if no additional props or styles are added', () => {
      sinon.stub(React, 'cloneElement');
      result = resolve(<div styled="noStyles" />, context, stylesheet);
      expect(React.cloneElement).not.to.have.been.called;
      React.cloneElement.restore();
    });
  });

  describe('with attach plugins', () => {
    it('applies and attaches the results of attach plugins', () => {
      let pluginOne = {attach: sinon.spy(() => 42)};
      let pluginTwo = {attach: sinon.spy(() => 43)};
      configure({plugins: [pluginOne, pluginTwo]});
      stylesheet.base({root: ruleOne});
      result = resolve(<div styled="root" />, context, stylesheet);

      expect(pluginOne.attach).to.have.been.calledWith([ruleOne], {React: config.React});
      expect(pluginTwo.attach).to.have.been.calledWith(42, {React: config.React});
      expect(result.props.style).to.equal(43);
    });
  });
});
