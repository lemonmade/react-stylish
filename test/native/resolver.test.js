import '../helper';
import resolve from '../../native/resolver';
import config from '../../common/config';
import StyleSheet from '../../common/StyleSheet';
import React from 'react-native';

class Base extends React.Component {
  render() { return this.props.children; }
}

class CustomComponent extends Base {}

const BUILT_IN_COMPONENTS = [
  'View',
  'Text',
  'DatePickerIOS',
  'DrawerLayoutAndroid',
  'Image',
  'ListView',
  'MapView',
  'Navigator',
  'Modal',
  'NavigatorIOS',
  'PickerIOS',
  'ProgressBarAndroid',
  'ProgressViewIOS',
  'ScrollView',
  'SegmentedControlIOS',
  'SliderIOS',
  'SwitchAndroid',
  'SwitchIOS',
  'TabBarIOS',
  'TabBarIOS.Item',
  'TextInput',
  'ToolbarAndroid',
  'TouchableHighlight',
  'TouchableNativeFeedback',
  'TouchableOpacity',
  'TouchableWithoutFeedback',
  'WebView',
].map((component) => {
  class Mock extends Base {
    static displayName = component;
  }

  return Mock;
});

const View = BUILT_IN_COMPONENTS[0];

const RULES = Object.freeze({
  base: [{backgroundColor: 'red'}],
  nested: [{backgroundColor: 'green'}],
});

let styles = new StyleSheet();
styles.for = sinon.spy((component) => (RULES[component] && [RULES[component]]) || []);

describe('Stylish native', () => {
  describe('resolve', () => {
    let rendered;
    let context;

    beforeEach(() => {
      context = new View({});
      config.plugins.attach = [];
    });

    it('resolves built-in React Native components', () => {
      BUILT_IN_COMPONENTS.forEach((Component) => {
        rendered = resolve({rendered: React.createElement(Component, {styled: 'base'}), styles, context});
        expect(rendered.props.style).to.deep.equal([RULES.base]);
      });
    });

    it('resolves nested React Native components', () => {
      BUILT_IN_COMPONENTS.forEach((Component) => {
        let element = React.createElement(Component, {styled: 'base'}, React.createElement(View, {styled: 'nested'}));
        rendered = resolve({rendered: element, styles, context});
        expect(rendered.props.style).to.deep.equal([RULES.base]);
        expect(rendered.props.children.props.style).to.deep.equal([RULES.nested]);
      });
    });

    it('resolves components nested in an Animated view', () => {
      // Get the same structure as React.Animated.View
      class AnimatedComponent extends Base {}
      const Animated = {View: AnimatedComponent};
      let element = React.createElement(Animated.View, {styled: 'base'}, React.createElement(View, {styled: 'nested'}));

      rendered = resolve({rendered: element, styles, context});
      expect(rendered.props.style).to.deep.equal([RULES.base]);
      expect(rendered.props.children.props.style).to.deep.equal([RULES.nested]);
    });

    describe('custom components', () => {
      let customElement;

      beforeEach(() => {
        customElement = React.createElement(CustomComponent, {styled: 'base'}, React.createElement(View, {styled: 'nested'}));
      });

      it('does not resolve custom components or native components nested within them', () => {
        rendered = resolve({rendered: customElement, styles, context});
        expect(rendered.props.style).to.be.undefined;
        expect(rendered.props.children.props.style).to.be.undefined;
      });

      it('resolves custom components and native components nested within them when the depth is specified', () => {
        rendered = resolve({rendered: customElement, styles, context, options: {depth: 10}});
        expect(rendered.props.style).to.deep.equal([RULES.base]);
        expect(rendered.props.children.props.style).to.deep.equal([RULES.nested]);
      });

      it('resolves custom components and native components nested within them when the depth is not considered', () => {
        rendered = resolve({rendered: customElement, styles, context, options: {depth: false}});
        expect(rendered.props.style).to.deep.equal([RULES.base]);
        expect(rendered.props.children.props.style).to.deep.equal([RULES.nested]);
      });
    });
  });
});
