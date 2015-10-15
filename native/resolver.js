import React from 'react-native';
import createResolver from '../common/resolver';

const BUILT_IN_COMPONENTS = [
  'View',
  'Text',
  'AnimatedComponent',
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
];

export default createResolver({
  Children: React.Children,
  isValidElement: React.isValidElement,
  cloneElement: React.cloneElement,
  isCustomComponent(element) {
    return BUILT_IN_COMPONENTS.indexOf(element.type.displayName || element.type.name) < 0;
  },
});
