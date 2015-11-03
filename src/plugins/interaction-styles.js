import environment from 'exenv';
import {flatten} from '../common/utilities';

const INTERACTION_STATES = ['hover', 'focus', 'active'];
const PSEUDO_INTERACTION_STATES = INTERACTION_STATES.map((state) => `:${state}`);
const KEYS_FOR_ACTIVE = [' ', 'enter'];

function nextMouseupListener(callback) {
  function handler(event) {
    callback(event);
    window.removeEventListener('mouseup', handler);
  }

  window.addEventListener('mouseup', handler);
}

export function createInteractionStylesPlugin({canUseEventListeners}) {
  let cache = {};

  let Plugin = {
    reserve(key, value, {pseudo = false} = {}) {
      const STATES = pseudo ? PSEUDO_INTERACTION_STATES : INTERACTION_STATES;
      return STATES.indexOf(key) >= 0;
    },

    add(rule, {component, stylesheet, pseudo = false}) {
      let interactions = cache[stylesheet.id] || {hover: {}, focus: {}, active: {}};
      let STATES = pseudo ? PSEUDO_INTERACTION_STATES : INTERACTION_STATES;

      STATES.forEach((state, index) => {
        let normalizeState = INTERACTION_STATES[index];
        interactions[normalizeState][component] = interactions[normalizeState][component] || Boolean(rule[state]);
      });

      cache[stylesheet.id] = interactions;

      let result = {};

      STATES.forEach((state, index) => {
        let normalizedState = INTERACTION_STATES[index];

        if (rule[state]) {
          result[normalizedState] = rule[state];
          delete rule[state];
        }
      });

      result.base = rule;
      return result;
    },
  };

  if (canUseEventListeners) {
    Plugin.resolve = function(rules, {stylishState, component}) {
      if (!canUseEventListeners) { return []; }

      let interactionState = stylishState.interactions || {hover: {}, focus: {}, active: {}};

      return flatten(INTERACTION_STATES.filter((name) => {
        return interactionState[name][component] && rules[name];
      }).map((name) => {
        return rules[name];
      }));
    };

    Plugin.augment = function(props, {component, stylesheet, stylishState, setState}) {
      let newProps = {};
      if (!canUseEventListeners) { return newProps; }

      let interactionState = stylishState.interactions || {hover: {}, focus: {}, active: {}};
      let statePresence = cache[stylesheet.id] || {hover: {}, focus: {}, active: {}};

      function setInteractionState(stateName, value) {
        setState({
          interactions: {
            ...interactionState,
            [stateName]: {...interactionState[stateName], [component]: value},
          },
        });
      }

      if (statePresence.hover[component]) {
        let originalOnMouseEnter = props.onMouseEnter;
        newProps.onMouseEnter = function(event) {
          if (originalOnMouseEnter) { originalOnMouseEnter.call(this, event); }
          setInteractionState('hover', true);
        };

        let originalOnMouseLeave = props.onMouseLeave;
        newProps.onMouseLeave = function(event) {
          if (originalOnMouseLeave) { originalOnMouseLeave.call(this, event); }
          setInteractionState('hover', false);
        };
      }

      if (statePresence.focus[component]) {
        let originalOnFocus = props.onFocus;
        newProps.onFocus = function(event) {
          if (originalOnFocus) { originalOnFocus.call(this, event); }
          setInteractionState('focus', true);
        };

        let originalOnBlur = props.onBlur;
        newProps.onBlur = function(event) {
          if (originalOnBlur) { originalOnBlur.call(this, event); }
          setInteractionState('focus', false);
        };
      }

      if (statePresence.active[component]) {
        let originalOnKeyDown = props.onKeyDown;
        newProps.onKeyDown = function(event) {
          if (originalOnKeyDown) { originalOnKeyDown.call(this, event); }
          if (KEYS_FOR_ACTIVE.indexOf(event.key.toLowerCase()) >= 0) {
            setInteractionState('active', true);
          }
        };

        let originalOnKeyUp = props.onKeyUp;
        newProps.onKeyUp = function(event) {
          if (originalOnKeyUp) { originalOnKeyUp.call(this, event); }
          if (KEYS_FOR_ACTIVE.indexOf(event.key.toLowerCase()) >= 0) {
            setInteractionState('active', false);
          }
        };

        let originalOnMouseDown = props.onMouseDown;
        newProps.onMouseDown = function(event) {
          if (originalOnMouseDown) { originalOnMouseDown.call(this, event); }
          setInteractionState('active', true);
        };

        if (interactionState.active[component]) {
          nextMouseupListener(() => setInteractionState('active', false));
        }
      }

      return newProps;
    };
  }

  return Plugin;
}

export default createInteractionStylesPlugin(environment);
