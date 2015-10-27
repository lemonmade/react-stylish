import resolve from './resolve';

export function createConnector(resolver) {
  return function connect(styles, options = {}) {
    return function(Component) {
      let {render, componentWillMount} = Component.prototype;

      Component.prototype.componentWillMount = function() {
        if (componentWillMount) { componentWillMount.apply(this, arguments); }
        this.setState({_StylishState: {}});
      };

      Component.prototype.render = function() {
        let rendered = render.apply(this, arguments);
        return resolver({rendered, styles, options, context: this});
      };

      return Component;
    };
  };
}

export default createConnector(resolve);
