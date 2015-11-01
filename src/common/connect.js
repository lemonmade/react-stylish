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

      Component.prototype.setStylishState = function(newState) {
        this.setState({_StylishState: {...this.stylishState, ...newState}});
      };

      Object.defineProperty(Component.prototype, 'stylishState', {
        get() { return (this.state && this.state._StylishState) || {}; },
        configurable: true,
      });

      Component.prototype.componentWillMount = function() {
        if (componentWillMount) { componentWillMount.apply(this, arguments); }
        this.setStylishState({});
      };

      Component.prototype.render = function() {
        let element = render.apply(this, arguments);
        return resolver(element, this, stylesheet, options);
      };

      Component.displayName = Component.displayName || Component.name;

      let decorateConfig = {stylesheet, React: config.React};

      return config.plugins
        .filter((plugin) => Boolean(plugin.decorate))
        .reduce((DecoratedComponent, plugin) => {
          return plugin.decorate(DecoratedComponent, decorateConfig);
        }, Component);
    };
  };
}

export default createConnector(resolve);
