import resolve from './resolve';

export function createConnector(resolver) {
  return function connect(stylesheet, options = {}) {
    return function(Component) {
      let {render, componentWillMount} = Component.prototype;

      Component.prototype.componentWillMount = function() {
        if (componentWillMount) { componentWillMount.apply(this, arguments); }
        this.setState({_StylishState: {}});
      };

      Component.prototype.render = function() {
        let element = render.apply(this, arguments);
        return resolver(element, this, stylesheet, options);
      };

      return Component;
    };
  };
}

export default createConnector(resolve);
