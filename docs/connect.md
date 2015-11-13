# `Stylish.connect`

After you've [created][create-styles-url] your styles, you'll need to connect it to components in order for it to apply. You can do so using the `Stylish.connect`:

```javascript
import Stylish from 'react-stylish'; // or, react-stylish/native if doing React Native!

let styles = Stylish.create();
class MyComponent extends React.Component {}
MyComponent = Stylish.connect(styles)(MyComponent)
```

`Stylish.connect` takes a style object and an options object (described below), and returns a function to which you pass your actual component. Because of the structure of this application, you can use it as an [ES2016 decorator][es6-decorator-url]:

```javascript
let styles = Stylish.create();

@Stylish.connect(styles)
class MyComponent extends React.Component {}
```

The second (optional) argument to `Stylish.connect` is an options object. It allows you to specify how styles are actually applied in a number of ways, each of which is described below.

## `identifier`

The `identifier` is the `prop` that Stylish will look for to determine what subcomponent a given node is (and, therefore, what styles should apply to it). By default, Stylish looks for a `styled` property on nodes to associate them with the subcomponents you declared while [creating your styles][create-styles-url]:

```javascript
@Stylish.connect(styles)
class MyComponent extends React.Component {
  render() {
    return (
      <div styled="container">
        <h1 styled="heading">Welcome!</h1>
      </div>
    );
  }
}
```

The example above will look for rules for `container` to add to the outer `div`, and will look for rules for `heading` for the `h1`.

In your connection options, you can choose a different identifier attribute to use as the name for subcomponents:

```javascript
@Stylish.connect(styles, {identifier: 'is'})
class MyComponent extends React.Component {
  render() {
    return (
      <div is="container">
        <h1 is="heading">Welcome!</h1>
      </div>
    );
  }
}
```

If your style object encapsulates a [single component][single-component-url] (rather than having multiple subcomponents), you can use a blank identifier to signal that a particular node is the one that should get any applicable rules:

```javascript
@Stylish.connect(styles)
class MyComponent extends React.Component {
  render() {
    return <button styled>A solo button</button>;
  }
}
```

You can also include multiple identifiers as a space-separated list in the identifier attribute. Rules for all matching identfiers will be added in the order they are written. In general, avoid doing this: it usually means one node is taking on too many responsibilities or that there are variations you have not identified correctly.

```javascript
@Stylish.connect(styles)
class MyComponent extends React.Component {
  render() {
    // will get rules for both 'button' and 'control' subcomponents
    // of styles
    return <button styled="button control">A button</button>;
  }
}
```

## `depth`

By default, Stylish will traverse your component's entire rendered tree to find nodes to add styles to. However, any elements nested inside custom components in the tree will not be traversed by default. Stylish assumes that anything nested in a custom component is styled as part of that component, and so does not try to do any additional resolution. The example below illustrates this:

```javascript
@Stylish.connect(styles)
class MyComponent extends React.Component {
  render() {
    return (
      <div>
        // will be traversed/ have styles added
        <h1 styled="heading">Welcome!</h1>

        <WelcomeMessage>
          // will not be traversed/ have styles added
          <p styled="paragraph">Thanks for coming!</p>
        </WelcomeMessage>
      </div>
    );
  }
}
```

You can adjust this behavior by changing the `depth` argument. If you pass an integer, the rendered tree will be traversed only up to that depth, which includes components nested in custom components. The following example illustrates this:

```javascript
@Stylish.connect(styles, {depth: 3})
class MyComponent extends React.Component {
  render() {
    return (
      <div>
        // will be traversed/ have styles added
        <h1 styled="heading">Welcome!</h1>

        // too deep, won't get styles
        <div><div><div><div styled="deeply-nested" /></div></div></div>

        <WelcomeMessage>
          // will be traversed/ have styles added
          <p styled="paragraph">Thanks for coming!</p>
        </WelcomeMessage>
      </div>
    );
  }
}
```

You can also for traversal of the entire tree (including inside custom components) by setting the `depth` option to `false`:

```javascript
@Stylish.connect(styles, {depth: false})
class MyComponent extends React.Component {
  render() {
    return (
      <div>
        // will be traversed/ have styles added
        <h1 styled="heading">Welcome!</h1>

        // will be traversed/ have styles added
        <div><div><div><div styled="deeply-nested" /></div></div></div>

        <WelcomeMessage>
          // will be traversed/ have styles added
          <p styled="paragraph">Thanks for coming!</p>
        </WelcomeMessage>
      </div>
    );
  }
}
```

## `variationMapping`

As noted in the explanation of [creating variations][create-variation-url], variation styles are automatically added when a matching `props` or `state` value is found in the component. You may find that you want to have a variation name that does not match any `props` or `state` value, but may be computed from them.

The `variationMapping` argument lets you specify a function. This function must return an object whose keys are the names of your variations and the values are the values to use in checking whether a variation should be applied or not. This object will be the first step in checking what a variation's value is; if no variation is found in the mapping, Stylish will fall back to the `state` value, then the `props` value.

The example below illustrates how this is used in practice.

```javascript
let styles = Stylish.create();

styles.variations({
  active: {
    button: {background: 'green'},
  },

  destructive: {
    button: {background: 'red'},
  },

  withSpacing: {
    button: {marginBottom: 20},
  },
});

function variationMapping(component) {
  return {
    withSpacing: Boolean(component.props.hasSpace || component.state.isSpaced),
  };
}

@connect(styles, {variationMapping})
class MyComponent extends React.Component {
  static defaultProps = {destructive: false, active: false};

  constructor(props) {
    super(props);
    this.state = {active: true, withSpacing: true};
  }

  render() {
    return <button styled="button">My button</button>;
  }
}
```

In the example above, there are three variations:

- The `active` variation's value will be treated as `true` because the `state` of the component has a `true` value (the `props` also have an `active` value, defaulted to `false`, but `state` will take precendence).

- The `destructive` variation's value will be treated as `false` because only `props` has a value for it, which defaults to `false`.

- The `withSpacing` variation will be treated as the result of `Boolean(component.props.hasSpace || component.state.isSpaced)`, which was declared by the `variationMapping` argument. Even though `state` has a key named `withSpacing`, the variation mapping takes precendence.



[create-styles-url]: https://github.com/lemonmade/react-stylish/blob/master/docs/create.md
[es6-decorator-url]: https://medium.com/google-developers/exploring-es7-decorators-76ecb65fb841
[single-component-url]: https://github.com/lemonmade/react-stylish/blob/master/docs/create.md#single-subcomponents
[create-variation-url]: https://github.com/lemonmade/react-stylish/blob/master/docs/create.md#variations
