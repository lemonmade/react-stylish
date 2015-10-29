const ReactStyleSheetPlugin = {
  create(rule, {React, dynamic = false}) {
    if (dynamic || !React.isNative) { return rule; }
    let {StyleSheet} = React;
    return StyleSheet.create({base: rule}).base;
  },
};

export default ReactStyleSheetPlugin;
