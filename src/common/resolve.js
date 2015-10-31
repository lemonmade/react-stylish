import * as _ from './utilities';
import config from './config';

const IDENTIFIER_SPLITTER = /\s+/;

let context = null;
let stylesheet = null;
let options = null;

export default function resolve(element, theContext, theStylesheet, theOptions) {
  context = theContext;
  stylesheet = theStylesheet;

  options = {...config, ...theOptions};
  options.visit = visitStrategy(options);
  options.variationMapping = (options.variationMapping && options.variationMapping(context)) || {};

  let result = resolveElement(element, null, 0, 1);

  stylesheet = context = options = null;

  return result;
}

function resolveElement(element, parent, index, level) {
  let {React} = config;

  if (!element.props || !options.visit(element, level)) { return element; }

  let newChildren = resolveChildren(element.props.children, element, level + 1);
  let newProps = resolveProps(element, parent, index);

  if (
    newProps === element.props &&
    newChildren === element.props.children
  ) { return element; }

  return React.cloneElement(element, newProps !== element.props ? newProps : {}, newChildren);
}

function styleIsPresent(style) {
  return !((_.isArray(style) || _.isObject(style)) && _.isEmpty(style));
}

function resolveProps(element, parent, index) {
  let {props} = element;
  let identifier = stylesheet.isSingleComponent ? 'root' : props[options.identifier];
  if (!identifier) { return props; }

  let identifiers = identifier.split(IDENTIFIER_SPLITTER);
  let style = resolveStyles(element, parent, index);

  let setState = ::context.setState;
  let stylishState = (context.state && context.state._StylishState) || {};
  let augmentOptions = {
    React: config.React,
    stylishState,
    context,
    element,
    stylesheet,
    parent,
    index,
    setState(newState) {
      setState({_StylishState: {...stylishState, ...newState}});
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

function resolveStyles(element, parent, index) {
  let identifier = stylesheet.isSingleComponent ? 'root' : element.props[options.identifier];
  let {state = {}, props} = context;
  let {variationMapping} = options;
  let resolveOptions = {
    React: config.React,
    stylishState: state._StylishState || {},
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

  let pluginRules = config.plugins
    .filter((plugin) => Boolean(plugin.resolve))
    .map((plugin) => plugin.resolve(rules, resolveOptions));

  return _.flatten(rules.base.concat(pluginRules)).map((rule) => {
    return _.isFunction(rule) ? rule.call(context, context) : rule;
  });
}

function resolveChildren(children, parent, level) {
  let {React} = options;
  let {Children, isValidElement} = React;

  if (!options.visit(children, level)) {
    return children;
  }

  if (Children.count(children) === 1 && children.type) {
    return resolveElement(Children.only(children), parent, 0, level);
  }

  return Children.map(children, (child, index) => {
    if (!isValidElement(child)) { return child; }
    return resolveElement(child, parent, index, level);
  });
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

    let isArray = _.isArray(element);
    let isReact = React.isValidElement(element) && !React.isCustomComponent(element);
    return isArray || isReact;
  };
}
