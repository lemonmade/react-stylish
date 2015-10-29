import * as _ from './utilities';
import config from './config';

const IDENTIFIER_SPLITTER = /\s+/;

export default function resolve(element, context, stylesheet, options = {}) {
  options = {...config, ...options};
  options.visit = visitStrategy(options);
  options.variationMapping = (options.variationMapping && options.variationMapping(context)) || {};
  options.level = 1;

  return resolveElement(element, null, 0, context, stylesheet, options);
}

function resolveElement(element, parent, index, context, stylesheet, options) {
  let {React, level} = options;

  if (_.isFunction(element)) {
    return composedFunction(element, parent, index, context, stylesheet, options);
  }

  if (!element.props || !options.visit(element, level)) { return element; }

  options.level += 1;
  let newChildren = resolveChildren(element.props.children, element, context, stylesheet, options);
  let newProps = resolveProps(element, parent, index, context, stylesheet, options);
  options.level -= 1;

  if (
    newProps === element.props &&
    newChildren === element.props.children
  ) { return element; }

  return React.cloneElement(element, newProps !== element.props ? newProps : {}, newChildren);
}

function styleIsPresent(style) {
  return !((_.isArray(style) || _.isObject(style)) && _.isEmpty(style));
}

function resolveProps(element, parent, index, context, stylesheet, options) {
  let {props} = element;
  let identifier = stylesheet.isSingleComponent ? 'root' : props[options.identifier];
  if (!identifier) { return props; }

  let identifiers = identifier.split(IDENTIFIER_SPLITTER);
  let style = resolveStyles(element, parent, index, context, stylesheet, options);

  let stylishState = (context.state && context.state.stylishState) || {};
  let augmentOptions = {
    React: config.React,
    stylishState,
    context,
    element,
    stylesheet,
    parent,
    index,
    setState(newState) {
      context.setState({stylishState: {...stylishState, ...newState}});
    },
  };

  let newProps = config.plugins
    .filter((plugin) => Boolean(plugin.augment))
    .map((plugin) => {
      return identifiers.map((id) => {
        augmentOptions.component = id;
        return plugin.augment(props, augmentOptions);
      });
    });

  newProps = _.merge({}, ..._.flatten(newProps, true));

  if (styleIsPresent(style)) {
    props = {...props, style};
  }

  if (!_.isEmpty(newProps)) {
    props = {...props, ...newProps};
  }

  return props;
}

function resolveStyles(element, parent, index, context, stylesheet, options) {
  let identifier = stylesheet.isSingleComponent ? 'root' : element.props[options.identifier];
  let {state = {}, props = {}} = context;
  let {variationMapping} = options;
  let resolveOptions = {
    React: config.React,
    stylishState: state.stylishState || {},
    context,
    element,
    stylesheet,
    parent,
    index,
  };

  function variationValue(variation) {
    let value = null;
    let variationDetails = stylesheet.variationDetails[variation];

    if (variationMapping[variation] != null) {
      value = variationMapping[variation];
    } else if (state[variation] != null) {
      value = state[variation];
    } else {
      value = props[variation];
    }

    if (value == null) { return value; }
    return (variationDetails.isBoolean ? Boolean(value) : value).toString();
  }

  let rules = identifier.split(IDENTIFIER_SPLITTER).map((id) => {
    let componentRules = stylesheet.rules[id];
    if (!componentRules) { return null; }

    resolveOptions.component = id;
    let baseRules = resolveRules(componentRules.base, resolveOptions);

    let variationRules = Object.keys(componentRules).map((variation) => {
      let value = variationValue(variation);
      if (value == null) { return null; }
      return resolveRules(componentRules[variation][value], resolveOptions);
    });

    return [baseRules, variationRules];
  });

  if (element.props.style) {
    rules.push(element.props.style);
  }

  rules = _.compact(_.flatten(rules, true));

  let attachOptions = {React: config.React};
  config.plugins
    .filter((plugin) => Boolean(plugin.attach))
    .forEach((plugin) => rules = plugin.attach(rules, attachOptions));

  return rules;
}

function resolveRules(rules, resolveOptions) {
  if (!rules) { return null; }
  let {context} = resolveOptions;

  let pluginRules = config.plugins
    .filter((plugin) => Boolean(plugin.resolve))
    .map((plugin) => plugin.resolve(rules, resolveOptions));

  return _.flatten(rules.base.concat(pluginRules)).map((rule) => {
    return _.isFunction(rule) ? rule.call(context, context) : rule;
  });
}

function resolveChildren(children, parent, context, stylesheet, options) {
  let {React, level} = options;
  let {Children, isValidElement} = React;

  if (!options.visit(children, level)) {
    return children;
  }

  if (_.isFunction(children)) {
    return composedFunction(children, parent, 0, context, stylesheet, options);
  }

  if (Children.count(children) === 1 && children.type) {
    return resolveElement(Children.only(children), parent, 0, context, stylesheet, options);
  }

  return Children.map(children, (child, index) => {
    if (!isValidElement(child)) { return child; }
    return resolveElement(child, parent, index, context, stylesheet, options);
  });
}

function composedFunction(func, parent, index, context, stylesheet, options) {
  return function() {
    let {React} = options;
    let element = func.apply(this, arguments);

    if (!React.isValidElement(element)) { return element; }
    return resolveElement(element, parent, index, context, stylesheet, {...options});
  };
}

function visitStrategy({depth, React}) {
  if (!depth) {
    return (element) => Boolean(element);
  }

  if (_.isNumber(depth)) {
    return (element, level) => Boolean(element) && level <= depth;
  }

  return (element) => {
    if (!element) { return false; }

    let isFunction = _.isFunction(element);
    let isArray = _.isArray(element);
    let isReact = React.isValidElement(element) && !React.isCustomComponent(element);
    return isFunction || isArray || isReact;
  };
}
