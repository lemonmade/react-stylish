import React from 'react-native';

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

React.isNative = true;
React.isDom = false;

React.isCustomComponent = function(element) {
  return BUILT_IN_COMPONENTS.indexOf(element.type.displayName || element.type.name) < 0;
};

export default React;
