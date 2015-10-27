import _ from 'lodash';
import config from './config';
// import {applyAttachPlugins} from '../plugins/apply-plugins';
function applyAttachPlugins() {}
// import * as _ from '../common/utilities';

const IDENTIFIER_SPLITTER = /\s+/;

export default function resolve({rendered, styles, context, options = {}}) {
  options = {...config, ...options};
  options.visit = visitStrategy(options);
  options.variationMapping = options.variationMapping && options.variationMapping(context);
  styles.attach(context);

  return resolveElement({element: rendered, context, styles, level: 1, options});
}

function resolveElement({element, styles, context, level, options}) {
  let {React} = options;

  if (_.isFunction(element)) {
    return composedFunction({func: element, styles, context, level, options});
  }

  if (!element.props || !options.visit(element, level)) { return element; }

  let newChildren = resolveChildren({
    children: element.props.children,
    styles,
    context,
    level: level + 1,
    options,
  });

  let newProps = resolveProps({element, styles, context, options});

  if (
    newProps === element.props &&
    newChildren === element.props.children
  ) { return element; }

  return React.cloneElement(element, newProps !== element.props ? newProps : {}, newChildren);
}

function resolveProps({element, context, styles, options}) {
  let {identifier} = options;

  let name = element.props[identifier];
  if (!name) { return element.props; }

  let props = {...element.props};
  let rules = _.flatten(name.split(IDENTIFIER_SPLITTER).map((id) => {
    return styles.for(id, options.variationMapping);
  }));

  if (props.style) {
    rules.push(props.style);
  }

  rules = applyAttachPlugins({rules});
  if (!_.isEmpty(rules)) { props.style = rules; }
  return props;
}

function resolveChildren({children, styles, context, level, options}) {
  let {React} = options;

  if (!options.visit(children, level)) {
    return children;
  }

  if (_.isFunction(children)) {
    return composedFunction({func: children, styles, context, level, options});
  }

  if (React.Children.count(children) === 1 && children.type) {
    return resolveElement({
      element: React.Children.only(children),
      styles,
      context,
      level,
      options,
    });
  }

  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) { return child; }
    return resolveElement({element: child, styles, context, level, options});
  });
}

function composedFunction({func, styles, context, level, options}) {
  return function() {
    let {React} = options;
    let element = func.apply(this, arguments);

    if (!React.isValidElement(element)) { return element; }
    return resolveElement({element, styles, context, level, options});
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
