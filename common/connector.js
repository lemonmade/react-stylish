export default function connector({resolver}) {
  return function connect(styles, options = {}) {
    return function(Component) {
      let {render, componentWillMount} = Component.prototype;

      Component.prototype.componentWillMount = function() {
        if (componentWillMount) { componentWillMount.apply(this, arguments); }
        this.setState({_StylishState: {hover: {}, active: {}, focus: {}}});
      };

      Component.prototype.stylesFor = Component.prototype.stylesFor || function(component) {
        styles.attach(this);
        return styles.for(component);
      };

      Component.prototype.render = function() {
        let rendered = render.apply(this, arguments);
        return resolver({rendered, styles, options, context: this});
      };

      return Component;
    };
  };
}
