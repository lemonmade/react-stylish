import _ from 'lodash';
import config from './config';
import {applyAttachPlugins} from '../plugins/apply-plugins';
// import * as _ from '../common/utilities';

export default function createResolver(React) {
  let defaultOptions = {
    depth: config.depth,
    identifier: config.identifier,
    React,
  };

  return function resolve({rendered, styles, context, options = {}}) {
    options = {...defaultOptions, ...options};
    options.visit = visitStrategy(options);
    options.variationMapping = options.variationMapping && options.variationMapping(context);
    styles.attach(context);

    return resolveElement({element: rendered, context, styles, level: 1, options});
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

function nextMouseupListener(callback) {
  function handler(event) {
    callback(event);
    window.removeEventListener('mouseup', handler);
  }

  window.addEventListener('mouseup', handler);
}

function resolveInteractionStyles({component, props, context, styles}) {
  let interactions = styles.interactions[component];
  if (!interactions) { return; }

  function setState(interactionState, value) {
    let existingState = context.state._StylishState || {};

    context.setState({
      _StylishState: {
        ...existingState,
        [interactionState]: {...existingState[interactionState], [component]: value},
      },
    });
  }

  if (interactions.hover) {
    let originalOnMouseEnter = props.onMouseEnter;
    props.onMouseEnter = function(event) {
      if (originalOnMouseEnter) { originalOnMouseEnter.call(this, event); }
      setState('hover', true);
    };

    let originalOnMouseLeave = props.onMouseLeave;
    props.onMouseLeave = function(event) {
      if (originalOnMouseLeave) { originalOnMouseLeave.call(this, event); }
      setState('hover', false);
    };
  }

  if (interactions.focus) {
    let originalOnFocus = props.onFocus;
    props.onFocus = function(event) {
      if (originalOnFocus) { originalOnFocus.call(this, event); }
      setState('focus', true);
    };

    let originalOnBlur = props.onBlur;
    props.onBlur = function(event) {
      if (originalOnBlur) { originalOnBlur.call(this, event); }
      setState('focus', false);
    };
  }

  if (interactions.active) {
    const KEYS_FOR_ACTIVE = [' ', 'enter'];

    let originalOnKeyDown = props.onKeyDown;
    props.onKeyDown = function(event) {
      if (originalOnKeyDown) { originalOnKeyDown.call(this, event); }
      if (KEYS_FOR_ACTIVE.indexOf(event.key.toLowerCase()) >= 0) {
        setState('active', true);
      }
    };

    let originalOnKeyUp = props.onKeyUp;
    props.onKeyUp = function(event) {
      if (originalOnKeyUp) { originalOnKeyUp.call(this, event); }
      if (KEYS_FOR_ACTIVE.indexOf(event.key.toLowerCase()) >= 0) {
        setState('active', false);
      }
    };

    let originalOnMouseDown = props.onMouseDown;
    props.onMouseDown = function(event) {
      if (originalOnMouseDown) { originalOnMouseDown.call(this, event); }
      setState('active', true);
    };

    let stylishState = context.state && context.state._StylishState;
    if (stylishState && stylishState.active[component]) {
      nextMouseupListener(() => setState('active', false));
    }
  }
}

const IDENTIFIER_SPLITTER = /\s+/;

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
  resolveInteractionStyles({component: name, props, context, styles});
  return props;
}

function composedFunction({func, styles, context, level, options}) {
  return function() {
    let {React} = options;
    let element = func.apply(this, arguments);

    if (!React.isValidElement(element)) { return element; }
    return resolveElement({element, styles, context, level, options});
  };
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
