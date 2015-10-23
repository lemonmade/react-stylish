import config from '../common/config';

export function applyCreatePlugins({rule, dynamic = false}) {
  let {isDom, isNative} = config.React;

  config.plugins.create.forEach((plugin) => {
    rule = plugin({
      rule,
      isDom,
      isNative,
      dynamic,
      React: config.React.Library,
    });
  });

  return rule;
}

export function applyAttachPlugins({rules}) {
  let {isDom, isNative} = config.React;

  config.plugins.attach.forEach((plugin) => {
    rules = plugin({
      rules,
      isDom,
      isNative,
      React: config.React.Library,
    });
  });

  return rules;
}
