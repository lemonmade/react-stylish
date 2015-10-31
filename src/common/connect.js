import config from './config';
import resolve from './resolve';

export function createConnector(resolver) {
  return function connect(stylesheet, options = {}) {
    return function(Component) {
      // Stateless components
      if (!Component.render && !Component.prototype.render) {
        let statelessRender = Component;

        Component = class extends config.React.Component {
          static displayName = statelessRender.name;

          render() {
            return statelessRender(this.props, this.context);
          }
        };
      }

      let {render, componentWillMount} = Component.prototype;

      Component.prototype.componentWillMount = function() {
        if (componentWillMount) { componentWillMount.apply(this, arguments); }
        this.setState({_StylishState: {}});
      };

      Component.prototype.render = function() {
        let element = render.apply(this, arguments);
        return resolver(element, this, stylesheet, options);
      };

      Component.displayName = Component.displayName || Component.name;

      return Component;
    };
  };
}

export default createConnector(resolve);
