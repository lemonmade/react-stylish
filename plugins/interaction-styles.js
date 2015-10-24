const INTERACTION_STATES = ['hover', 'focus', 'active'];
const KEYS_FOR_ACTIVE = [' ', 'enter'];
let cache = {};

function nextMouseupListener(callback) {
  function handler(event) {
    callback(event);
    window.removeEventListener('mouseup', handler);
  }

  window.addEventListener('mouseup', handler);
}

const InteractionStylesPlugin = {
  add({rule, component, stylesheet}) {
    let interactions = cache[stylesheet.id] || {hover: {}, focus: {}, active: {}};
    INTERACTION_STATES.forEach((state) => {
      if (interactions[state][component] == null) {
        interactions[state][component] = Boolean(rule[state]);
      }
    });
    cache[stylesheet.id] = interactions;

    let {hover, focus, active, ...base} = rule;

    return INTERACTION_STATES.reduce((result, state) => {
      if (rule[state]) { result[state] = rule[state]; }
      return result;
    }, {base});
  },

  resolve({rules, props, component, stylesheet, state, setState}) {
    let interactionState = state.interactions || {hover: {}, focus: {}, active: {}};
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
      props.onMouseEnter = function(event) {
        if (originalOnMouseEnter) { originalOnMouseEnter.call(this, event); }
        setInteractionState('hover', true);
      };

      let originalOnMouseLeave = props.onMouseLeave;
      props.onMouseLeave = function(event) {
        if (originalOnMouseLeave) { originalOnMouseLeave.call(this, event); }
        setInteractionState('hover', false);
      };
    }

    if (statePresence.focus[component]) {
      let originalOnFocus = props.onFocus;
      props.onFocus = function(event) {
        if (originalOnFocus) { originalOnFocus.call(this, event); }
        setInteractionState('focus', true);
      };

      let originalOnBlur = props.onBlur;
      props.onBlur = function(event) {
        if (originalOnBlur) { originalOnBlur.call(this, event); }
        setInteractionState('focus', false);
      };
    }

    if (statePresence.active[component]) {
      let originalOnKeyDown = props.onKeyDown;
      props.onKeyDown = function(event) {
        if (originalOnKeyDown) { originalOnKeyDown.call(this, event); }
        if (KEYS_FOR_ACTIVE.indexOf(event.key.toLowerCase()) >= 0) {
          setInteractionState('active', true);
        }
      };

      let originalOnKeyUp = props.onKeyUp;
      props.onKeyUp = function(event) {
        if (originalOnKeyUp) { originalOnKeyUp.call(this, event); }
        if (KEYS_FOR_ACTIVE.indexOf(event.key.toLowerCase()) >= 0) {
          setInteractionState('active', false);
        }
      };

      let originalOnMouseDown = props.onMouseDown;
      props.onMouseDown = function(event) {
        if (originalOnMouseDown) { originalOnMouseDown.call(this, event); }
        setInteractionState('active', true);
      };

      if (state.interactions.active[component]) {
        nextMouseupListener(() => setInteractionState('active', false));
      }
    }

    return INTERACTION_STATES.filter((name) => {
      return interactionState[name][component] && rules[name];
    }).map((name) => {
      return rules[name];
    });
  },

  reset() { cache = {}; },
};

export default InteractionStylesPlugin;
