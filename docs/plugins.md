# Plugins

Plugins can hook into a number of steps in the creation and resolution of styles managed by Stylish. They can conceivably do everything from converting and linting values used in your rules, to enabling dynamically-applied rules like CSS's `:hover` and container queries. Stylish uses plugins for most of its bundled functionality, and it's easy to write your own.

## Enabling Plugins

A selection of plugins that make sense are enabled by default in both the React DOM and Native versions of Stylish. You can, however, completely replace the default plugins by calling Stylish's [`configure` function]() with the `plugins` key set to an array of plugins you wish to enable (all bundled plugins detailed below are available on `Stylish.Plugins`):

```javascript
import Stylish from 'react-stylish';

Stylish.configure({
  plugins: [
    Stylish.Plugins.PxToRem,
    Stylish.Plugins.VendorPrefixes,
    MyCustomPlugin,
    Stylish.Plugins.MergeRules,
  ],
});
```

To be clear, you only need to do this **if you want to change the default plugins**. If you simply want to enable additional plugins, you can do so by calling `Stylish.configure.addPlugins` with all the new plugins as individual arguments.

```javascript
import Stylish from 'react-stylish';

Stylish.configure.addPlugins(
  Stylish.Plugins.PxToRem,
  MyCustomPlugin
);
```

## Bundled Plugins

### `InteractionStyles`

Enabled by default for React DOM. It does not work with the React Native version.

The `InteractionStyles` plugin enables you to write the equivalent of CSS's `:hover`, `:focus`, and `:active` pseudo-classes. To do so, you write your rules that should apply inside of the component rules (either in base or variation rules):

```javascript
import Stylish from 'react-stylish';

let styles = Stylish.create({
  button: {
    color: 'white',
    padding: '1rem',
    background: '#51C364', // green

    // darker greens
    focus: {background: '#409A4F'},
    hover: {background: '#409A4F'},
    active: {background: '#409A4F'},
  }
})
```

If you want to make it feel even more CSS-ey, you globally configure Stylish to use "pseudo mode", which will require that these rules be prefixed with `:`:

```javascript
import Stylish from 'react-stylish';

Stylish.configure({pseudo: true});

let styles = Stylish.create({
  button: {
    color: 'white',
    padding: '1rem',
    background: '#51C364', // green

    // darker greens
    ':focus': {background: '#409A4F'},
    ':hover': {background: '#409A4F'},
    ':active': {background: '#409A4F'},
  }
});
```

For those interested, these rules work by storing some small set of state on your component and adding/ augmenting the necessary event listeners on subcomponents to update that state. All of this is done using the same plugin hooks available to you while writing your own plugins.

### `PositionalStyles`

Not enabled by default in React DOM or Native. However, it will work for both [if enabled]().

The `PositionalStyles` plugin lets you style elements based on their position within their parent. It provides `first`, `last`, `even`, and `odd` keys to use to target elements whose position within its parent matches that positional description. For example, rules you pass to `first` will only apply to an instance of the subcomponent that is the first child in its parent, and `even` will only apply those rules to every second element. Here's an example using a few of these keys:

```javascript
let styles = Stylish.create({
  child: {
    background: 'green',

    first: {background: 'red'},
    even: {background: 'blue'},
  },
});

@Stylish.connect(styles)
class MyComponent extends React.Component {
  render() {
    return (
      <div>
        <div styled="child" /> // background red, from 'first' rule
        <div styled="child" /> // background blue, from 'even' rule
        <div styled="child" /> // background green, from base rule
        <div /> // no background, not `styled` by Stylish!
      </div>
    );
  }
}
```

As with the `InteractionStyles` plugin, you can enable "pseudo mode" to force `:`-prefixed rules (`:first`, `:last`, `:even`, and `:odd`).

### `PxToRem`

Not enabled by default in React DOM or Native. However, it will work for React DOM [if enabled]().

The `PxToRem` plugin does exactly what it says on the tin: this plugin will convert straight numeric values (assumed to be in pixels) into the equivalent `rem` values. Here's an example:

```javascript
import Stylish from 'react-stylish';

let styles = Stylish.create({
  button: {
    borderWidth: 1, // stays 1
    padding: 16, // becomes '1rem'
    marginTop: 8, // becomes '0.5rem'
    marginBottom: 8, // becomes '0.5rem'
    opacity: 0.5, // stays 0.5
  },
});
```

`rem` units are often preferable as they allow you to update a single font size (at the root) and have it propagate throughout the page, a feature often desirable for responsive designs.

Note that in the example above, some properties were not converted to `rem`. The plugin has the smarts to know which properties should be/ are typically left with pixel units, or that don't require units at all. You can add additional properties that will *not* be converted to `rem` by using this plugin's `excluding` method to create a new version of the plugin with additional non-converted properties:

```javascript
import Stylish from 'react-stylish';

Stylish.configure.addPlugins(
  Stylish.Plugins.PxToRem.excluding('padding', 'marginTop')
);

let styles = Stylish.create({
  button: {
    borderWidth: 1, // stays 1
    padding: 16, // stays 16
    marginTop: 8, // stays 8
    marginBottom: 8, // becomes '0.5rem'
    opacity: 0.5, // stays 0.5
  },
});
```

### VendorPrefixes

Enabled by default for React DOM. It does not work with the React Native version.

The `VendorPrefixes` plugin adds the vendor prefixes that are actually necessary for the styles you write. All checks of both properties and values are cached, so you'll still get excellent performance without the headache or extra bytes of manually specifying every vendor prefix needed.

The output of this plugin depends on the browser being used, but in a browser that requires the WebKit prefix for the `transform` property and the `min-content` value, the following example illustrates this plugin in action:

```javascript
import Stylish from 'react-stylish';

Stylish.configure.addPlugins(
  Stylish.Plugins.PxToRem.excluding('padding', 'marginTop')
);

let styles = Stylish.create({
  button: {
    transform: 'scale(2)', // becomes `WebkitTransform: 'scale(2)'`
    minWidth: 'min-content', // becomes `minWidth: '-webkit-min-content'`
  },
});
```

### ContainerQueries

Enabled by default for React DOM. It does not work with the React Native version.

The `ContainerQueries` plugin allows you to define simple, width-based container queries; that is, styles that apply only when conditions on the width available to the *component as a whole* are true.

It does this by adding an `object` element, absolutely positioned on a wrapper around your component, which detects resizes in the component and updates a bit of state attached to your component. Note that this implementation has the following side effects/ drawbacks; the wrapper around your component is a `block`-level element that exactly wraps your component, and that has `relative` positioning. This may have implications for such things as positioning of interior elements (if you depend on a node higher in the tree being the relatively-positioned parent) and flexbox (if your component depends on being inside a flex container). There can also be issues if your container queries' rules cause the width of the component to change.

If these restrictions do not affect your component (which they won't in most cases), you can include a container query by using the result of `Stylish.ContainerQueries.create` (or `Stylish.CQ.create`) as the key for rules you would like to apply conditional upon that query matching. The `create` function accepts an object with a `min` and/ or `max` property (or `min` and `max` positional arguments). As illustrated in the example below, this is much easier when you use ES2015's [computed parameters]().

```javascript
let styles = Stylish.create({
  display: 'flex',
  flexDirection: 'column',
  padding: 10,

  [Stylish.CQ.create({min: 400})]: {
    flexDirection: 'row',
  },

  [Stylish.CQ.create({min: 600, max: 1000})]: {
    padding: 20,
  },
});
```

In the example above, two container query rules are created:

- The first applies when the component has `400px` or more width available to it, and changes the `flexDirection` to `'row'`.

- The second applies when the component has between `600px` and `1000px` of width available to it, and changes the `padding` to be `20`.

Note that all `min` and `max` values are inclusive. If you wish to define the same container queries for multiple components, simply cache the result of `create` and use it in your styles:

```javascript
let query = Stylish.CQ.create({min: 400});

let styles = Stylish.create({
  container: {
    backgroundColor: 'white',
    [query]: {backgroundColor: 'black'},
  },

  text: {
    color: 'black',
    [query]: {backgroundColor: 'white'},
  },
});
```

### MergeRules

Enabled by default for React DOM (it is, in fact, mandatory to use this plugin with React DOM). It does work with React Native, but should not be used as React Native styles are cached as numbers using `React.StyleSheet.create` where possible.

The `MergeRules` plugin combines the array of rules (objects) that Stylish's resolution steps generate into a single object, which the `style` attribute in React DOM expects.

### ReactStyleSheet

Enabled by default for React Native. It does not work with the React DOM version.

The `ReactStyleSheet` plugin sends static rules through React Native's `StyleSheet.create` and stores the result. `StyleSheet.create` is a performance optimization in React Native to prevent having to serialize complex style objects repeatedly, so it is best to leave this plugin enabled to reap the same performance benefits.

## Writing Your Own

Plugins are simply objects with methods whose names correspond to one or more of the hooks described below. Each hook has unique information provided to the component that make sense at that stage. Many plugins will use multiple hooks to function correctly; for example, the `InteractionStyles` plugin hooks into the `reserve` and `add` hooks (to access and extract interaction-related rules) and the `resolve` and `augment` hooks (to choose appropriate styles and add the necessary event handlers). See the [bundled plugins]() for informative examples of all of these hooks.

Note that this is the area of Stylish I am least satisfied with, so the exact hooks and associated arguments are subject to change.

### Creation Hooks

There are three hooks that are used when new rules are created via `Stylish.create`.

#### `reserve`

Use the `reserve` hook to indicate whether a particular key in a rule is reserved for use by your plugin. For example, the `InteractionStyles` plugin reserves `hover`, `focus`, and `active` (or `:hover`, `:focus`, and `:active` if the configuration is set to use [pseudo mode]()).

The `reserve` hook is passed two arguments: the `key` to consider, and the `value` of that key as specified by the user. In general, any key that you extract as part of the `add` hook should be marked as `reserved` (this allows Stylish to determine such things as whether a variation is boolean or enumerable, and whether a style object represents a single component).

```javascript
const RESERVED_KEYS = ['first', 'last'];

let MyPlugin = {
  reserve(key) {
    return RESERVED_KEYS.indexOf(key) >= 0;
  },
};
```

#### `add`

The `add` hook allows components to extract particular rules out of a broader rule, leaving the "base" rules intact. This is usually used for rules (such as `hover` or `first`) which are applied conditionally, and so should be removed from the "regular" rules. This hook is expected to return an object with a `base` key that has the basic rules without your conditional rules included, as well as keys with names of your choice to represent your conditional rules.

This hook is provided the following arguments:

- `rule`, an object with the rules for a particular component (may be "base" or variation rules)

- An `options` object with the following keys:
  - `component`: the string name of the component for which the rules are being added
  - `stylesheet`: the `StyleSheet` instance to which styles are being added
  - `pseudo`: a boolean indicating whether or not the user has configured "pseudo mode" (typically, this means you should only extract `:`-prefixed rules)

```javascript
const INTERACTION_STATES = ['hover', 'focus', 'active'];
const PSEUDO_INTERACTION_STATES = [':hover', ':focus', ':active'];

let MyPlugin = {
  add(rule, {component, stylesheet, pseudo = false}) {
    let STATES = pseudo ? PSEUDO_INTERACTION_STATES : INTERACTION_STATES;
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
}
```

#### `create`

The `create` hook is called for every rule (including those extracted as part of the `add` hook). It called on both static rules (provided as objects) and dynamic rules (provided as functions that return an object at render time). Plugins using this hook are expected to make some adjustments to the rule (for example, change or add values and properties) and return the resulting rule. This is used by the `VendorPrefixes`, `PxToRem`, and `ReactStyleSheet` plugins.

Plugins using this hook are provided the following arguments:

- `rule`, an object with all the rules for a particular component (note that if an earlier plugin transformed this into something that is not an object, such as `ReactStyleSheet`'s transformation to integers, you will receive that instead)

- An `options` object with the following keys:
  - `dynamic`: a boolean indicating whether the rule was static (provided as an object by the user) or dynamic (returned from a user-provided function rule)

```javascript
let MyPlugin = {
  create(rule, options) {
    return Object.keys(rule).reduce((newRule, key) => {
      let value = rule[key];
      newRule[key] = (typeof value === 'number')
        ? (Math.random() * value)
        : value;
      return newRule;
    }, {})
  },
}
```

### Resolution Hooks

There are four hooks that are used when rules are connected and applied to a component (initiated by `Stylish.connect`).

#### `decorate`

The `decorate` hook is called every time `Stylish.connect` is called. Use this hook to add or overwrite existing methods on the component connected to Stylish. For example, the container queries plugin uses this hook to add some addition mounting/ un-mounting hooks, and to wrap the default render call in an additional component against which the resize tracker is positioned.

Handlers for this hook are called with the following arguments:

- The `Component` that is being `connect`ed to `Stylish` (stateless components are first wrapped in a class so that Stylish can manage some state and lifecycle hooks).

- An `options` object with the following keys:
  - `stylesheet`: the `StyleSheet` object being `connect`ed to `Component`
  - `React`: the version of `React` that is being used

You should return the augmented `Component` from this plugin. Note that you should ensure that you do not directly overwrite methods; if adding additional lifecycle hooks or other methods, make sure to check (and call) any existing methods.

#### `resolve`

The `resolve` hook is called for each variation/ base rule that is matched by Stylish. Your plugin can then select some extra rules that should be applied. This will typically be the rules that you extracted as part of the `add` hook (for example, the `InteractionStyles` plugin adds interaction rules that match the current state).

Handlers for this hook are called with the following arguments:

- The `rules` object representing the matched rules, which will be an object with keys for each style object extracted in the `add` stage.

- The `options` object with the following keys:
  - `React`: the correct React object (depends on whether React DOM or Native is being used)
  - `stylishState`: the object that stores all Stylish-related state (which can be updated by the `setState` key in the `augment` hook)
  - `context`: the instance of your custom React component (can be useful to access its `state` and `props`)
  - `element`: the DOM node to which styles are being added
  - `component`: the string identifier of the DOM node that matched the passed `rules`
  - `stylesheet`: the `StyleSheet` object from which the styles were matched
  - `parent`: the parent node of the matched `element` (`null` if the matched element is the root of your render tree)
  - `index`: the (zero-based) index of the matched `element` within its siblings

Your plugin implementing this hook is expected to return an array of additional rules (as objects) matched based on your plugin.

```javascript
let Plugin = {
  resolve(rules, {stylishState, component}) {
    let interactionState = stylishState.interactions || {hover: {}, focus: {}, active: {}};

    return flatten(INTERACTION_STATES.filter((name) => {
      return interactionState[name][component] && rules[name];
    }).map((name) => {
      return rules[name];
    }));
  },
};
```

#### `augment`

The `augment` hook is called to allow your component to add/ update props for components that have identifiers managed by Stylish. This is used, for instance, by the `InteractionStyles` plugin to add event listeners where necessary.

Plugins implementing this hook are provided with the following arguments:

- The original `props` of the element with an identifier managed by Stylish.

- An `options` object with all of the same keys as the `resolve` plugins, plus:
  - `setState`: a function that will directly update the state managed by Stylish (use this instead of using the component's `setState`, as this function will manage a namespace for all Stylish plugins).

Your plugin is expected to return an object from this function with any new/ updated `props` that should be added to the component (do **not** directly update the `props` argument to this hook).

```javascript
let MyPlugin = {
  augment(props, {setState, stylishState, component}) {
    let originalOnHover = props.onHover;

    return {
      onHover() {
        if (originalOnHover) { originalOnHover.apply(this, arguments); }
        setState({
          hoveredComponents: [...stylishState.hoveredComponents, component],
        })
      },
    };
  }
};
```

#### `attach`

The `attach` hook is called just before matching rules are actually attached to your components. It should be used to perform any final adjustments on all matched rules. The `MergeRules` plugin uses this to merge all object rules together when using React DOM.

Plugins implementing this hook are provided with the following arguments:

- All `rules` that were matched for a given identifier.

- An `options` object with the following keys:
  - `React`: the correct React object (depends on whether React DOM or Native is being used)

```javascript
let MyPlugin = {
  attach(rules, {React}) {
    if (!isArray(rules) || !React.isDom) { return rules; }
    return merge({}, ...rules);
  },
};
```
