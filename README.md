# Stylish

An opinionated and extensible styling helper for React and React Native.

[![Build status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Maintained][maintained-image]][maintained-url] [![NPM version][npm-image]][npm-url] [![Dependency Status][dependency-image]][dependency-url] [![Dev Dependency Status][devDependency-image]][devDependency-url] [![Code Climate][climate-image]][climate-url]

## Installation

```bash
npm install react-stylish
```

Note that this generates a [UMD build][umd-url] of Stylish available at `react-stylish/dist/stylish.js` (or `react-stylish/dist/stylish.min.js` for the minified build). Where possible, try to avoid using this build and, instead, follow the usage instructions detailed below.

## Docs

Need help? Check out the [docs][docs-url] directory for advanced usage information.

## Usage

Stylish allows you to declare "base" styles, which will be always be applied, and "variation" styles, which will only be applied if there is a `props` or `state` value in your component matching the condition for that rule. After creation, you simply attach your styles to the component and add a special `styled` prop to your elements in order to associate exactly which styles to use. Plugins can pick up on special keys inside of your rules and do all the necessary manipulation to resolve those rules, too (in the example below, `hover` rules will only apply on hover of the component, and the container query rule will only apply when the width available to your component matches the conditions you set).

```javascript
import React from 'react';
import Stylish from 'react-stylish';

let styles = Stylish.create({
  // Rules for the container subcomponent
  container: {
    padding: 20,

    // Only applied when this element is hovered
    hover: {backgroundColor: 'gray'},
  },

  // Rules for the heading subcomponent
  heading: {
    marginBottom: 20,
    fontSize: 24,

    // Only applied when the container is at least 600px wide
    [Stylish.ContainerQueries.create({min: 600})]: {fontSize: 30},
  }
});

styles.variations({
  // Only applied when `props.disabled` or `state.disabled` are `true`
  disabled: {
    container: {
      pointerEvents: 'none',
      opacity: 0.6,
    },
  },

  type: {
    // Only applied when `props.type` or `state.type` are `'condensed'`
    condensed: {
      container: {
        padding: 10,
      },

      heading: {
        marginBottom: 20,
      },
    },
  },
});

@Stylish.connect(styles)
class Greeting extends React.Component {
  static propTypes = {
    disabled: React.PropTypes.bool,
    message: React.PropTypes.string.isRequired,
    type: React.PropTypes.oneOf('regular', 'condensed'),
  }

  render() {
    // Note that the `styled` attributes correspond to the names given during
    // style creation.

    return (
      <div styled="container">
        <h1 styled="heading">{this.props.message}</h1>
      </div>
    );
  }
}
```

### React Native

Stylish is fully compatible with React Native. In fact, the `create` API is almost entirely compatible with React Native's `StyleSheet.create`. Stylish will automatically pass your rules to `StyleSheet.create` to prevent sending a new style object every time and, just like `StyleSheet.create`, the object returned from creating a Stylish stylesheet has the "base" rules as keys (for example, the above example would have `styles.container` and `styles.heading` with just the basic rules included).

Note that you must `import` from the native entry file for Stylish to work with React Native:

```javascript
import Stylish from 'react-stylish/native';

// Continue as you would, the whole API is still available!
```

Note, too, that many of the plugins enabled by default in Stylish for React DOM are disabled for React Native (interaction styles like hover and focus, container queries, etc) as these require DOM-specific APIs.

## How is it different?

Stylish is opinionated in how you should apply your styles. Most obviously, it completely eschews CSS; styles can only be written in JavaScript. In my opinion, this gives you the same benefits as the collocation of markup and logic that makes React such a pleasure to use.

The API enforces that you declare "base" styles (that are always applied) and, optionally, "variation" styles (which are applied **only** when there is a matching `prop` or `state` value, or you provide a value for it via the [`variationMapping` option][variation-mapping-url]). I believe this to be the correct way to apply styles — any variations you want users to be able to perform should be exposed as `props`, and your component can then resolve those `props` into the necessary styles internally.

Now, Stylish is not dictatorial in all respects. It provides many points at which [Plugins][plugins-url] can manipulate what styles are created and attached, and offers many handy features by default:

- Container queries for building *truly* responsive designs. See the example above for an example of declaring container queries in your styles.

- Interaction rules (`hover`, `focus`, and `active`), corresponding to the `:hover`, `:focus`, and `:active` pseudo-classes from CSS (no more setting state on your own!).

- Automatic vendor prefixing of properties that require it.

- Supports declaration of [dynamic rules][dynamic-rules-url] that are evaluated at render, so you can declare styles that use values from `props` or `state` alongside your "static" rules.

- Positional rules (`first`, `last`, `even`, and `odd`), corresponding to the `:first-child`, `:last-child`, `:nth-child(even)`, and `:nth-child(odd)` pseudo-classes from CSS (you must [explicitly add this plugin][enable-plugins-url] as it is not enabled by default).

- Automatic conversion of pixel (numeric) values to their corresponding `rem` values (you must [explicitly add this plugin][enable-plugins-url] as it is not enabled by default).

- Support for ES6 class components and React 0.14 stateless components.



[travis-url]: https://travis-ci.org/lemonmade/react-stylish
[travis-image]: https://travis-ci.org/lemonmade/react-stylish.svg?branch=master

[coveralls-url]: https://coveralls.io/github/lemonmade/react-stylish?branch=master
[coveralls-image]: https://coveralls.io/repos/lemonmade/react-stylish/badge.svg?branch=master&service=github

[dependency-url]: https://david-dm.org/lemonmade/react-stylish
[dependency-image]: https://david-dm.org/lemonmade/react-stylish.svg

[devDependency-url]: https://david-dm.org/lemonmade/react-stylish
[devDependency-image]: https://david-dm.org/lemonmade/react-stylish.svg

[npm-url]: https://npmjs.org/package/react-native-stylish
[npm-image]: http://img.shields.io/npm/v/react-native-stylish.svg?style=flat-square

[climate-url]: https://codeclimate.com/github/lemonmade/react-stylish
[climate-image]: http://img.shields.io/codeclimate/github/lemonmade/react-stylish.svg?style=flat-square

[maintained-url]: https://github.com/yannickcr/eslint-plugin-react/pulse
[maintained-image]: http://img.shields.io/badge/status-maintained-brightgreen.svg?style=flat-square

[umd-url]: https://github.com/umdjs/umd
[docs-url]: https://github.com/lemonmade/react-stylish/tree/master/docs
[plugins-url]: https://github.com/lemonmade/react-stylish/tree/master/docs/plugins.md
[variation-mapping-url]: https://github.com/lemonmade/react-stylish/blob/master/docs/connect.md#variationmapping
[dynamic-rules-url]: https://github.com/lemonmade/react-stylish/blob/master/docs/create.md#function-rules
[enable-plugins-url]: https://github.com/lemonmade/react-stylish/blob/master/docs/plugins.md#enabling-plugins
