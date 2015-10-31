import '../helper';

import ReactDOM from 'react';
import proxyquire from 'proxyquire';

const React = proxyquire('../../src/react/native', {
  'react-native': {
    ...ReactDOM,
    '@noCallThru': true,
  },
});

describe('Stylish Native', () => {
  describe('React', () => {
    it('sets the react version to Native', () => {
      expect(React).to.equal(React);
      expect(React.isDom).to.be.false;
      expect(React.isNative).to.be.true;
    });

    describe('.isCustomComponent', () => {
      class CustomComponent extends React.Component {
        render() { return this.props.children; }
      }

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
        class Mock extends React.Component {
          static displayName = component;

          render() { return this.props.children; }
        }

        return Mock;
      });

      it('adds a .isCustomComponent static method to React', () => {
        expect(React.isCustomComponent).to.be.a('function');
      });

      it('identifies DOM elements as not being custom', () => {
        BUILT_IN_COMPONENTS.forEach((component) => {
          let element = React.createElement(component);
          expect(React.isCustomComponent(element)).to.be.false;
        });
      });

      it('identifies custom classes as being custom', () => {
        let element = React.createElement(CustomComponent);
        expect(React.isCustomComponent(element)).to.be.true;
      });
    });
  });
});
