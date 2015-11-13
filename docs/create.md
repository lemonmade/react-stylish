# `Stylish.create`

`Stylish.create` allows you to define the styles for any number of "subcomponents" (DOM nodes in React DOM, views in React Native) in a similar way to React Native's `StyleSheet.create`. The basic syntax is simply passing an object to this function where the keys are names of subcomponents and the values are, themselves, objects with all style rules.

```javascript
import Stylish from 'react-stylish'; // or, react-stylish/native if doing React Native!

let styles = Stylish.create({
  text: {
    color: 'black',
    fontSize: 18,
  },

  icon: {
    height: 16,
    width: 16,
    marginLeft: 8,
    fill: 'red',
  },
});
```

Note that, unlike in CSS, rule names are written in camelcase (you can still use the CSS version of the property, but you would need to wrap each key in quotes).

The object you get back from this function is what you [connect][connect-url] to your components. You can also chain it with calls to `variation` or `variations` to add rules that apply only if some `props`/ `state` in your component match the conditions you set, as described below.

## Variations

Stylish considers a "variation" to be any set of styles that should only be applied if a specific condition is met by the component. In React's component model, the easiest ways to express those conditions is by using `props` and/ or `state`. Based on this convention, Stylish lets you describe your variations by simply matching the variation name to the prop/ state name, which removes the need for you to manually decide which styles should apply at any given time.

To add variation rules to your created styles, you can use the `variations` method of the object you get from `Stylish.create` (or the `variation` method, if you have only one). In general, that will take the form of an additional level of nesting in your rules: your actual rules are nested in an object that describes which component they apply to, and your components are nested inside an object that describes what variation those rules actually apply for.

```javascript
let styles = Stylish.create();

styles.variations({
  large: {
    text: {fontSize: 26},
    icon: {
      height: 24,
      width: 24,
    },
  }
});

// or, equivalently:

styles.variation('large', {
  text: {fontSize: 26},
  icon: {
    height: 24,
    width: 24,
  },
});
```

In the example above, when there is a `state` or `props` key whose name is `large` and whose value is truthy, the rules inside will be added to any rules declared in `create` (these rules will take precedence). The above would usually be paired with a `propTypes` declaration on your component indicating that this is a boolean property:

```javascript
class MyComponent extends React.Component {
  static propTypes = {large: React.PropTypes.bool};
}
```

### Enumerable Variations

Your variations need not be boolean. You can also create enumerable variations, where the variation will check itself against the actual value of a given `props`/ `state` value to see if it should apply. This takes the form of another level of nesting; nest the rules inside the component, the component inside the value of a property that it should apply for, nested inside the name of the property.

```javascript
let styles = Stylish.create();

styles.variations({
  size: {
    large: {
      text: {fontSize: 26},
      icon: {
        height: 24,
        width: 24,
      },
    },
  }
});

// or, equivalently:

styles.variation('size', {
  large: {
    text: {fontSize: 26},
    icon: {
      height: 24,
      width: 24,
    },
  },
});
```

In the example above, when there is a `state` or `props` key whose name is `size` and whose value is exactly `'large'`, the rules inside will be added to any rules declared in `create` (these rules will take precedence). The above would usually be paired with a `propTypes` declaration on your component indicating that this is an enumerable property:

```javascript
class MyComponent extends React.Component {
  static propTypes = {
    size: React.PropTypes.oneOf(['small', 'medium', 'large']),
  };
}
```

### Multiple Variations

You can describe multiple different variations in a single `variations` method call, and those variations can be boolean, enumerable, or both.

```javascript
let styles = Stylish.create();

styles.variations({
  large: {
    text: {fontSize: 26},
    icon: {
      height: 24,
      width: 24,
    },
  },

  type: {
    primary: {
      icon: {fill: 'blue'},
    },
  },
});
```

As shown above, a given variation also doesn't need to have styles for all the subcomponents — the `type: primary` rule above only has rules for the `icon` subcomponent.

When describing enumerable variations, you can provide rules for any number of possible values for that enumeration, not just one as was shown above. Just include extra variation values as keys:


```javascript
let styles = Stylish.create();

styles.variations({
  size: {
    small: {
      // rules for 'small' value of 'size'
    },

    medium: {
      // rules for 'medium' value of 'size'
    },

    large: {
      // rules for 'large' value of 'size'
    },
  }
});
```

## Function Rules

Sometimes, you can't express your rules statically. Perhaps, some part of that value depends on a stateful value of the component. Stylish allows you to define rules as functions, rather than objects. Below, you can see two equivalent ways of writing a rule:

```javascript
let staticStyles = Stylish.create({
  text: {
    color: 'black',
    fontSize: 18,
  },
});

let dynamicStyles = Stylish.create({
  text: function() {
    return {
      color: 'black',
      fontSize: 18,
    };
  },
});
```

Of course, the example above is not very useful as there are no dynamic values in the styles being returned. You should avoid using function rules in this case as it prevents some optimizations that can be done for static rules. The usefulness comes in when you need to access a component's `state` or `props` to construct your rules. To enable this, Stylish passes you the instance of your component, from which you can access its `state` or `props`:

```javascript
let dynamicStyles = Stylish.create({
  text: function(component) {
    return {
      transform: `scale(${component.state.currentScale})`,
    };
  },
});
```

In the example above, we create a rule whose transform value depends on a `state` value in the component. That way, every time `state` is updated and `render` is called, the correct rule is generated.

Dynamic rules can be used in your "base" styles (as shown above) and in any variation rules you can create. They can also be used for plugin rules (described below). Finally, you can include both dynamic and static rules by providing an array with both:

```javascript
let allTheStyles = Stylish.create({
  text: [
    {
      color: 'black',
      fontSize: 18,
    },

    function(component) {
      return {
        transform: `scale(${component.state.currentScale})`,
      };
    },
  ],
});
```

## Plugin Rules

Some [plugins][plugins-url] allow you to include extra, conditional rules inline with your regular rules. For example, the [`InteractionStyles` plugin][interaction-styles-plugin-url] lets you include rules inside `hover`, `focus`, and `active` styles inline with your regular rules:

```javascript
let styles = Stylish.create({
  button: {
    background: '#51C364', // green

    // darker greens
    focus: {background: '#409A4F'},
    hover: {background: '#409A4F'},
    active: {background: '#409A4F'},
  }
});
```

Plugin rules can include both static and dynamic rules. You can include plugin rules in the "base" rules (as shown above), or in variation rules:

```javascript
let styles = Stylish.create();

styles.variations({
  destructive: {
    button: {
      background: '#D7564F', // red

      // darker reds
      focus: {background: '#A62F2C'},
      hover: {background: '#A62F2C'},
      active: {background: '#A62F2C'},
    }
  }
})
```

For details on what plugins are available and what "custom" rules they enable, see the [list of all built-in plugins][bundled-plugins-url].

## Single Subcomponents

In many components, particularly the most "atomic" ones, it can be frustrating to have to nest all rules inside a subcomponent as there may only be a single subcomponent that is being styled. Stylish allows you to omit the subcomponent name in both base and variation rules if you have a single subcomponent:

```javascript
let buttonStyles = Stylish.create({
  background: '#51C364', // green

  // darker greens
  focus: {background: '#409A4F'},
  hover: {background: '#409A4F'},
  active: {background: '#409A4F'},
});

buttonStyles.variations({
  destructive: {
    background: '#D7564F', // red

    // darker reds
    focus: {background: '#A62F2C'},
    hover: {background: '#A62F2C'},
    active: {background: '#A62F2C'},
  }
})
```



[connect-url]: https://github.com/lemonmade/react-stylish/blob/master/docs/connect.md
[plugins-url]: https://github.com/lemonmade/react-stylish/blob/master/docs/plugins.md
[interaction-styles-plugin-url]: https://github.com/lemonmade/react-stylish/blob/master/docs/plugins.md#interactionstyles
[bundled-plugins-url]: https://github.com/lemonmade/react-stylish/blob/master/docs/plugins.md#bundled-plugins
