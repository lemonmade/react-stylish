# React Native Stylish

[![Build status][circle-image]][circle-url] [![NPM version][npm-image]][npm-url]

`Stylish` allows you to provide a base set of styles and style updates that should be applied for particular states and props of a component in a nice, declarative way. It also provides for automatic or manual mechanisms to apply those styles when rendering your components.

## Usage

### Creation

To create your styles, first import the `create` function from `Stylish`.

```javascript
import {create} from 'react-native-stylish'; // or:
import * as Stylish from 'react-native-stylish'; // then you've got Stylish.create
```

To create your stylesheet, pass the base styles to the imported function. These base styles should be in the same format as what you pass to React's `StyleSheet.create`: an object with nested objects representing distinct styles. Take special care in naming the keys of this object: the names should correspond to the name of the subcomponents you want to style, and `Stylish` depends on this naming consistency to do some smart things.

```javascript
// We're declaring styles for two subcomponents: a `background` and some `text`.
let styles = create({
  background: {
    backgroundColor: 'rgb(210, 210, 210)',
    padding: 10,
    marginTop: 10,
    marginBottom: 10
  },

  text: {
    fontSize: 15,
    color: 'rgb(70, 70, 70)'
  }
});
```

If you want to use `Stylish` simply as a stand-in for `React.StyleSheet`, your work is already done — in the example above, you can access `styles.background` and `styles.text` directly, just as you can for the result of `React.StyleSheet.create` (and, just as with React's stylesheets, the styles are indexed for performance).

Base styles will be applied regardless of what props/ state your component has. To provide variations on these components in response to state or props, Use the `variations` or `variation` method of the object returned from `create()`. The styles passed here are like extra-nested versions of the basic styles: you nest the styles to apply under the prop/ state key name that they respond to.

```javascript
let styles = create({ /* see above */ });

// Here, we add some styles to apply if there is a truthy `primary` state or prop.
// These styles will be combined with the base styles, with the variation styles
// taking precedence in the case of conflicts.
styles.variations({
  primary: {
    background: {backgroundColor: 'rgb(38, 174, 74)'},
    text: {color: 'white'}
  },

  disabled { /* pass as many variations as you want */ }
});

// The primary variation could also be added as follows:
styles.variation('primary', {
  background: {backgroundColor: 'rgb(38, 174, 74)'},
  text: {color: 'white'}
});
```

There are two types of variations that `Stylish` understands. The first, demonstrated above, is a boolean variation. In the example above, if `this.props.primary` or `this.state.primary` are truthy, the rules you have written will apply. In any other case, the rules will not be applied. This encourages the good practice of defaulting all variation properties to false and forcing users of your components to opt into variation styling (rather than opting out).

You can also supply enumerable variations. These variations will look at the current value of the relevant prop/ state, then find a key inside your variation that matches that value. If such a key is found, any rules declared will be added to the base styles and any other variations.

```javascript
let styles = create({ /* see above */ });

// Here, we add a `type` variation, and some possible values for `type`. If,
// for example, type is `'primary'`, the styles declared for that key will apply.
// Note that this adds an extra level of nesting for your styles.
styles.variations({
  type: {
    primary: {
      background: {backgroundColor: 'rgb(38, 174, 74)'},
      text: {color: 'white'}
    },

    secondary: {
      background: {backgroundColor: 'rgb(150, 150, 150)'},
      text: {color: 'white'}
    }
  }
});

// Again, can be written equivalently as:
styles.variation('type', {
  primary: {
    background: {backgroundColor: 'rgb(38, 174, 74)'},
    text: {color: 'white'}
  },

  secondary: {
    background: {backgroundColor: 'rgb(150, 150, 150)'},
    text: {color: 'white'}
  }
});
```

Note that you can have any number of enumerable and boolean variations. Those declared later will take precedence over those declared earlier in the case of conflicts. The Advanced section below has additional information on creating even more dynamic styles in response to variations.

### Application

Creating your styles isn't worth much if you don't connect them to your components. `Stylish` gives you multiple mechanisms to do so. The easiest way is use `Stylish`'s `connect` function to connect your styles to your component:

```javascript
import React from 'react-native';
import {create, connect} from 'react-native-stylish';
let styles = create({});

class MyComponent extends React.Component {}

export default connect(styles)(MyComponent);

// or, we can use the new decorator syntax:

@connect(styles)
class MyOtherComponent extends React.Component {}
```

Then, in your render method, give your subcomponents a name matching one of the keys in your stylesheets using the special `styled` prop:

```javascript
let {View, Text, Component} = React;

@connect(styles)
class MyComponent extends Component {
  render() {
    return (
      <View styled="background">
        <Text styled="text">Wow such magic</Text>
      </View>
    );
  }
}
```

`Stylish` will automatically traverse your rendered component looking for the `styled` property and using that as the basis for retrieving styles. It will also use the current `this.props` and `this.state` of your component's instances in resolving which variations to include.

You can also use the `stylesFor` instance method that `Stylish` adds to our class. This method returns an array of styles that apply to the component, so you can even add extra styles to it if you wish.

```javascript
let {View, Text, Component} = React;

@connect(styles)
class MyComponent extends Component {
  render() {
    return (
      <View style={this.stylesFor('background')}>
        <Text style={this.stylesFor('text')}>Wow such magic</Text>
      </View>
    );
  }
}
```

Finally, you can manually set the context (object with state and props) from which to resolve variations (using the style object's `context` method) and call the style object's `for` method directly:

```javascript
let {View, Text, Component} = React;

@connect(styles)
class MyComponent extends Component {
  render() {
    styles.context(this);

    return (
      <View style={styles.for('background')}>
        <Text style={styles.for('text')}>Wow such magic</Text>
      </View>
    );
  }
}
```

### Advanced

#### Connection Options

`Stylish.connect` takes a few options (as the second argument, after your style object) that determine how `Stylish` will apply your styles *when using the automatic application method*.

- `options.identifier`: The name of the prop that contains the (string) identifier of your subcomponents. As noted above, by default this identifier is `'styled'` (that is, `Stylish` will look at `this.props.styled` for a child's identifier).

- `options.depth`: `Stylish` will, by default, scan your whole rendered component for components to add styles to, ignoring branches rooted by custom (i.e., non-React-provided) components. I consider this the "smart" way to do things, since styles of subcomponents of your custom components should be styled by the components they are contained by (what a mouthful). If you want to override this, you can specify a custom depth (as a number); `Stylish` will then traverse your rendered component up to that many levels and add styles to all components, regardless of whether they were provided by React or not. You can also set this option to be `false`, in which case the entire rendered component will be traversed.

```javascript
@connect(styles, {depth: false, identifier: 'name'})
class MyComponent extends React.Component {}
```

#### Function Rules

In addition to (or in place of) object literal styles, you can provide functions to determine styles for a given component in one of two places:

1. For a component's base styles.

2. For the component rules in a variation.

In either case, your function will be called with the current value of the relevant property or state and in the context of your component instance (so you can access, for example, `this.state` or `this.props`). This is often necessary when you have a style whose value is based on an `Animated` value that is stored in `this.state`. Note that no optimizations can be done on these style rules, since they are not computed until `render` is called. Therefore, for any static rules, use object literals as described in earlier sections.

Rules returned from functions will take precendence over static rules.

The example below illustrates all possible usage of function styles:

```javascript
import {create, connect} from 'react-native-stylish';

let styles = create({
  button: [
    // called in the context of the component (`this === component`, and the
    // component is the first argument
    (component) => { return {top: this.state.dynamicValue}; },

    // you can still provide base styles!
    {backgroundColor: 'blue'}
  ]
});

styles.variations({
  size: {
    large: {
      // similar to base style (a dynamic and static style), but only added when
      // `this.props.size === 'large'`. The second argument is the prop's current
      // value.
      button: [
        (component, size) => { return {padding: PADDING_VALUES[size]}; },
        {backgroundColor: 'green'}
      ]
    }
  }
});

@connect(styles)
class Button extends React.Component {
  constructor(props) {
    super(props);
    this.state = {dynamicValue: new React.Animated.Value(1)};
  }

  render() {
    return (
      <React.Animated.View styled="button">
        <Text>Button text</Text>
      </React.Animated.View>
    );
  }
}
```

## Contributing

Clone the repo, then run `npm install` for dependencies. Make your changes to files in the `src` directory, ensuring that you add tests for any new behavior. Testing is done using [Jest](http://facebook.github.io/jest/), and you can run all tests using `script/test`. Please also annotate your code using [Flow](http://flowtype.org/) (this is checked as part of tests).

Once you have committed all of your changes, run `npm run release:<version>` (where version is one of patch, minor, or major) to release a new version, or run `npm run compile` (to transpile the script for non-ES6 uses) and manually tag/ release the appropriate version (if you are releasing a new minor or major version).

## Inspiration

The following tools heavily influenced the design and API of `Stylish`:

- [Radium](http://projects.formidablelabs.com/radium/)

- [Redux](http://rackt.github.io/redux/)

- [ReactCSS](http://reactcss.com/)

## Changelog

### 2.0.0

- Complete rework of the API.

### 1.0.2

- Fixed an issue with `prop`/ `state` keys that had identical names to components.

### 1.0.1

- Fixed issue where null `state`/ `props` would throw an error.

### 1.0.0

- Added the ability to use functions (in addition to object literals) to specify more complex styles or styles that have to be determined during `render` (for example, those relying on the use of values from `this.state`).

- Improved test coverage and converted as much as possible to ES6.

- Fixed dependency style of React Native.

- Updated linting config and corrected relevant errors.

### 0.0.6

- Protected against uninitialized props.

### 0.0.5

- Minor bugfix.

### 0.0.4

- Bugfixes in the boolean property detection.

### 0.0.3

- Improvements related to linting and ES6.

### 0.0.2

- Initial commit.

[npm-url]: https://npmjs.org/package/react-native-stylish
[npm-image]: http://img.shields.io/npm/v/react-native-stylish.svg?style=flat-square
[circle-url]: https://circleci.com/gh/Shopify/react-native-stylish
[circle-image]: https://circleci.com/gh/Shopify/react-native-stylish.svg?&style=shield&circle-token=c187e58a10368a08029b65e4f17b28ec3d48215f
