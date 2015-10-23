const POSITIONAL_STATES = ['first', 'last', 'even', 'odd'];

const positionalStateMatches = {
  first(index) { return index === 0; },
  last(index, siblings) { return index === siblings; },
  even(index) { return (index % 2) === 1; },
  odd(index) { return (index % 2) === 0; },
};

const PositionalStylesPlugin = {
  add({rule}) {
    let {first, last, even, odd, ...base} = rule;
    return {first, last, even, odd, base};
  },

  resolve({rules, React, index, parent}) {
    let siblingCount = parent ? React.Children.count(parent.props.children) : 0;

    return POSITIONAL_STATES.filter((name) => {
      return positionalStateMatches[name](index, siblingCount) && rules[name];
    }).map((name) => {
      return rules[name];
    });
  },
};

export default PositionalStylesPlugin;