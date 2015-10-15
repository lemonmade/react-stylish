import '../helper';
import React from 'react';
import resolver from '../../common/resolver';
import config from '../../common/config';
import StyleSheet from '../../common/StyleSheet';
import _ from 'lodash';

const RULES = Object.freeze({
  base: {backgroundColor: 'red'},
  nested: {backgroundColor: 'green'},
  nestedTwo: {backgroundColor: 'blue'},
});

let styles;

class CustomComponent extends React.Component {
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

describe('resolver', () => {
  let rendered;
  let resolve;
  let AugmentedReact;
  let context;

  beforeEach(() => {
    AugmentedReact = {...React, isCustomComponent() { return false; }};
    resolve = resolver(AugmentedReact);
    config.plugins.attach = [];
    context = new CustomComponent({});

    styles = new StyleSheet();
    styles.for = sinon.spy((component) => (RULES[component] && [RULES[component]]) || []);
  });

  it('attaches the styles to the passed context', () => {
    sinon.stub(styles, 'attach');
    resolve({rendered: <div />, styles, context});
    expect(styles.attach).to.have.been.calledWith(context);
  });

  it('adds styles to the root element', () => {
    rendered = resolve({rendered: <div styled="base" />, styles, context});
    expect(rendered.props.style).to.deep.equal([RULES.base]);
  });

  it('adds styles to nested elements', () => {
    rendered = resolve({rendered: <div styled="base"><div styled="nested" /></div>, styles, context});
    let nested = nestedChild(rendered);
    expect(nested.props.style).to.deep.equal([RULES.nested]);
  });

  it('adds styles to all nested elements', () => {
    rendered = resolve({rendered: <div styled="base"><div styled="nested" /><div styled="nestedTwo" /></div>, styles, context});
    React.Children.forEach(rendered.props.children, (nested) => {
      expect(nested.props.style).to.deep.equal([RULES[nested.props.styled]]);
    });
  });

  it('handles non-element children', () => {
    rendered = resolve({rendered: <div styled="base"><div styled="nested" />{"not a React element!"}</div>, styles, context});
    React.Children.forEach(rendered.props.children, (nested) => {
      if (!React.isValidElement(nested)) { return; }
      expect(nested.props.style).to.deep.equal([RULES.nested]);
    });
  });

  it('does not add styles to nested elements with the attribute but without styles', () => {
    rendered = resolve({rendered: <div styled="base"><div styled="noStyles" /></div>, styles, context});
    let nested = nestedChild(rendered);
    expect(nested.props.style).to.be.undefined;
  });

  it('allows function-wrapped elements to be stylized', () => {
    rendered = resolve({rendered: () => { return <div styled="base"><div styled="nested" /></div>; }, styles, context})();
    expect(rendered.props.style).to.deep.equal([RULES.base]);
    let nested = nestedChild(rendered);
    expect(nested.props.style).to.deep.equal([RULES.nested]);
  });

  it('allows function-wrapped children elements to be stylized', () => {
    class FunctionRenderer extends React.Component {
      render() { return this.props.children(); }
    }

    rendered = resolve({rendered: <FunctionRenderer>{() => <div styled="nested" />}</FunctionRenderer>, styles, context});
    let nested = rendered.props.children();
    expect(nested.props.style).to.deep.equal([RULES.nested]);
  });

  it('does not choke on function-wrapped elements that return a string', () => {
    rendered = resolve({rendered: () => { return 'foo'; }, styles, context})();
    expect(rendered).to.equal('foo');
  });

  it('merges an already-present style on the element, with the existing styles taking precedence', () => {
    let customStyle = {backgroundColor: 'purple'};
    rendered = resolve({rendered: <div style={customStyle} styled="base" />, styles, context});
    expect(rendered.props.style).to.deep.equal(_.flatten([RULES.base, customStyle]));
  });

  it('allows you to pass a custom identifier prop', () => {
    rendered = resolve({rendered: <div is="base"><div styled="nested" /></div>, styles, options: {identifier: 'is'}, context});
    expect(rendered.props.style).to.deep.equal([RULES.base]);
    let nested = nestedChild(rendered);
    expect(nested.props.style).to.be.undefined;
  });

  it('adds styles to non-custom-elements of any depth', () => {
    let deeplyNested = (
      <div><div><div><div><div><div><div><div>
        <div styled="nested" />
      </div></div></div></div></div></div></div></div>
    );

    rendered = resolve({rendered: deeplyNested, styles, context});
    let nested = nestedChild(rendered);
    expect(nested.props.style).to.deep.equal([RULES.nested]);
  });

  it('does not add styles when React.isCustomComponent is true', () => {
    // See the stub
    AugmentedReact.isCustomComponent = (element) => element.type === CustomComponent;
    rendered = resolve({rendered: <CustomComponent styled="base"><div styled="nested" /></CustomComponent>, styles, context});

    expect(rendered.props.style).to.be.undefined;
    expect(nestedChild(rendered).props.style).to.be.undefined;
  });

  it('attaches the result of applying the attach plugins', () => {
    let output = {backgroundColor: 'black'};
    let plugin = sinon.stub().returns(output);
    config.plugins.attach = plugin;

    rendered = resolve({rendered: <div styled="base" />, styles, context});
    expect(plugin).to.have.been.calledWith({rules: [RULES.base]});
    expect(rendered.props.style).to.deep.equal(output);
  });

  describe('interaction handlers', () => {
    it('does not add any listeners when there are no hover rules for the component', () => {
      rendered = resolve({rendered: <div styled="base" />, styles, context});
      expect(rendered.props.onMouseEnter).to.be.undefined;
      expect(rendered.props.onMouseLeave).to.be.undefined;
    });

    describe('with hover', () => {
      beforeEach(() => {
        styles.interactions.base = {hover: true};
        sinon.stub(context, 'setState');
      });

      it('adds an onMouseEnter listener', () => {
        rendered = resolve({rendered: <div styled="base" />, styles, context});
        expect(rendered.props.onMouseEnter).to.be.a('function');
      });

      it('mouseEnter calls setState with the hover status of that component set to true', () => {
        rendered = resolve({rendered: <div styled="base" />, styles, context});

        rendered.props.onMouseEnter();
        let newState = context.setState.lastCall.args[0];
        expect(newState._StylishState.hover.base).to.be.true;
      });

      it('mouseEnter overrides and calls an originally-set onMouseEnter handler', () => {
        let mouseEnter = sinon.spy();
        let event = {x: 0, y: 0};
        rendered = resolve({rendered: <div styled="base" onMouseEnter={mouseEnter} />, styles, context});

        rendered.props.onMouseEnter(event);
        expect(mouseEnter).to.have.been.calledWith(event);
      });

      it('adds an onMouseLeave listener', () => {
        rendered = resolve({rendered: <div styled="base" />, styles, context});
        expect(rendered.props.onMouseLeave).to.be.a('function');
      });

      it('mouseLeave calls setState with the hover status of that component set to false', () => {
        rendered = resolve({rendered: <div styled="base" />, styles, context});

        rendered.props.onMouseLeave();
        let newState = context.setState.lastCall.args[0];
        expect(newState._StylishState.hover.base).to.be.false;
      });

      it('mouseLeave overrides and calls an originally-set onMouseLeave handler', () => {
        let mouseLeave = sinon.spy();
        let event = {x: 0, y: 0};
        rendered = resolve({rendered: <div styled="base" onMouseLeave={mouseLeave} />, styles, context});

        rendered.props.onMouseLeave(event);
        expect(mouseLeave).to.have.been.calledWith(event);
      });
    });

    describe('with focus', () => {
      beforeEach(() => {
        styles.interactions.base = {focus: true};
        sinon.stub(context, 'setState');
      });

      it('adds an onFocus listener', () => {
        rendered = resolve({rendered: <div styled="base" />, styles, context});
        expect(rendered.props.onFocus).to.be.a('function');
      });

      it('focus calls setState with the focus status of that component set to true', () => {
        rendered = resolve({rendered: <div styled="base" />, styles, context});

        rendered.props.onFocus();
        let newState = context.setState.lastCall.args[0];
        expect(newState._StylishState.focus.base).to.be.true;
      });

      it('focus overrides and calls an originally-set onFocus handler', () => {
        let focus = sinon.spy();
        let event = {x: 0, y: 0};
        rendered = resolve({rendered: <div styled="base" onFocus={focus} />, styles, context});

        rendered.props.onFocus(event);
        expect(focus).to.have.been.calledWith(event);
      });

      it('adds an onBlur listener', () => {
        rendered = resolve({rendered: <div styled="base" />, styles, context});
        expect(rendered.props.onBlur).to.be.a('function');
      });

      it('blur calls setState with the focus status of that component set to false', () => {
        rendered = resolve({rendered: <div styled="base" />, styles, context});

        rendered.props.onBlur();
        let newState = context.setState.lastCall.args[0];
        expect(newState._StylishState.focus.base).to.be.false;
      });

      it('blur overrides and calls an originally-set onBlur handler', () => {
        let blur = sinon.spy();
        let event = {x: 0, y: 0};
        rendered = resolve({rendered: <div styled="base" onBlur={blur} />, styles, context});

        rendered.props.onBlur(event);
        expect(blur).to.have.been.calledWith(event);
      });
    });
  });

  describe('with options', () => {
    describe('depth', () => {
      it('does not add styles to elements nested too deeply for the custom depth', () => {
        let deeplyNested = (
          <div><div><div>
            <div styled="nested" />
          </div></div></div>
        );

        rendered = resolve({rendered: deeplyNested, styles, options: {depth: 3}, context});
        expect(nestedChild(rendered).props.style).to.be.undefined;
      });

      it('adds styles to custom elements within the depth limits', () => {
        AugmentedReact.isCustomComponent = (element) => element.type === CustomComponent;
        rendered = resolve({rendered: <CustomComponent styled="base"><div><div styled="nested" /></div></CustomComponent>, styles, context, options: {depth: 2}});
        expect(rendered.props.style).to.deep.equal([RULES.base]);
        expect(nestedChild(rendered).props.style).to.be.undefined;
      });

      it('allows you to resolve styles for the full tree', () => {
        rendered = resolve({rendered: <CustomComponent styled="base"><div><div styled="nested" /></div></CustomComponent>, styles, context, options: {depth: false}});
        expect(rendered.props.style).to.deep.equal([RULES.base]);
        expect(nestedChild(rendered).props.style).to.deep.equal([RULES.nested]);
      });
    });

    describe('variationMapping', () => {
      let element;
      let variationMapping;

      beforeEach(() => {
        element = <div styled="base" />;
        variationMapping = sinon.stub();
      });

      it('calls the mapping with the context', () => {
        resolve({rendered: element, styles, options: {variationMapping}, context});
        expect(variationMapping).to.have.been.calledWith(context);
      });

      it('calls styles.for with the resolved mapping', () => {
        let resolvedMapping = {active: false};
        variationMapping.returns(resolvedMapping);
        resolve({rendered: element, styles, options: {variationMapping}, context});
        expect(styles.for).to.have.been.calledWith('base', resolvedMapping);
      });
    });
  });
});
