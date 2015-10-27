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

  it('attaches styles from multiple styled strings', () => {
    rendered = resolve({rendered: <div styled="base nested" />, styles, context});
    expect(rendered.props.style).to.deep.equal(_.flatten([RULES.base, RULES.nested]));
  });

  it('ignores styled strings that do not have rules', () => {
    rendered = resolve({rendered: <div styled="base foo" />, styles, context});
    expect(rendered.props.style).to.deep.equal([RULES.base]);
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

    let pluginArg = plugin.lastCall.args[0];
    expect(pluginArg.rules).to.deep.equal([RULES.base]);
    expect(rendered.props.style).to.deep.equal(output);
  });
});
