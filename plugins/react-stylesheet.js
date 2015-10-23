export default function reactStyleSheet({rule, React, dynamic = false, isNative = true}) {
  if (dynamic || !isNative) { return rule; }
  let {StyleSheet} = React;
  return StyleSheet.create({base: rule}).base;
}
