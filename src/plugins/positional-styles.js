const POSITIONAL_STATES = ['first', 'last', 'even', 'odd'];
const PSEUDO_POSITIONAL_STATES = POSITIONAL_STATES.map((state) => `:${state}`);

const positionalStateMatches = {
  first(index) { return index === 0; },
  last(index, siblings) { return index === siblings; },
  even(index) { return (index % 2) === 1; },
  odd(index) { return (index % 2) === 0; },
};

const PositionalStylesPlugin = {
  reserve(key, value, {pseudo = false} = {}) {
    const STATES = pseudo ? PSEUDO_POSITIONAL_STATES : POSITIONAL_STATES;
    return STATES.indexOf(key) >= 0;
  },

  add(rule, {pseudo = false} = {}) {
    const STATES = pseudo ? PSEUDO_POSITIONAL_STATES : POSITIONAL_STATES;
    let result = {};

    STATES.forEach((state, index) => {
      let normalizedState = POSITIONAL_STATES[index];

      if (rule[state]) {
        result[normalizedState] = rule[state];
        delete rule[state];
      }
    });

    result.base = rule;
    return result;
  },

  resolve(rules, {React, index, parent}) {
    let siblingCount = parent ? React.Children.count(parent.props.children) - 1 : 0;

    return POSITIONAL_STATES.filter((name) => {
      return rules[name] && positionalStateMatches[name](index, siblingCount);
    }).map((name) => {
      return rules[name];
    });
  },
};

export default PositionalStylesPlugin;
