import config from '../common/config';

export function applyCreatePlugins({rule}) {
  config.plugins.create.forEach((plugin) => {
    let {options} = plugin;
    if (options) {
      if (options.react && options.react !== config.react) { return rule; }
      if (options.stage && options.stage !== 'create') { return rule; }
    }

    rule = plugin({rule});
  });

  return rule;
}

export function applyAttachPlugins({rules}) {
  config.plugins.attach.forEach((plugin) => {
    let {options} = plugin;
    if (options) {
      if (options.react && options.react !== config.react) { return rules; }
      if (options.stage && options.stage !== 'attach') { return rules; }
    }

    rules = plugin({rules});
  });

  return rules;
}
