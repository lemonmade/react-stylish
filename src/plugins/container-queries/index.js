import {PREFIX, parseContainerQuery} from './create';

const RESERVE_REGEX = new RegExp(`^${PREFIX}`);
let cache = {};

const ContainerQueriesPlugin = {
  reserve(key) {
    return RESERVE_REGEX.test(key);
  },

  add(rule, {stylesheet}) {
    let finalRule = {};
    let cachedQueries = cache[stylesheet.id] || {};

    Object.keys(rule)
      .filter((key) => RESERVE_REGEX.test(key))
      .forEach((query) => {
        finalRule[query] = rule[query];
        cachedQueries[query] = cachedQueries[query] || parseContainerQuery(query);
        delete rule[query];
      });

    cache[stylesheet.id] = cachedQueries;
    finalRule.base = rule;
    return finalRule;
  },

  resolve(rules, {stylishState}) {
    let matchingQueries = stylishState.containerQueries || [];
    return matchingQueries.map((query) => rules[query]);
  },

  decorate(Component, {stylesheet, React}) {
    let {componentDidMount, render, componentWillUnmount} = Component.prototype;
    let queries = cache[stylesheet.id] || {};
    let queryList = Object.keys(queries);

    if (!queryList.length) { return Component; }

    Component.prototype.componentDidMount = function() {
      if (componentDidMount) { componentDidMount.apply(this, arguments); }
      this.addStylishCQListener();
    };

    Component.prototype.componentWillUnmount = function() {
      if (componentWillUnmount) { componentWillUnmount.apply(this, arguments); }
      this.removeStylishCQListener();
    };

    Component.prototype.addStylishCQListener = function() {
      let wrapper = this.stylishCQWrapper;
      let obj = document.createElement('object');
      obj.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;');

      obj.setAttribute('tabindex', '-1');
      obj.resizeElement = wrapper;
      obj.onload = ::this.handleStylishCQListenerLoad;
      obj.data = 'about:blank';

      this.stylishCQResizeListener = obj;
      wrapper.appendChild(obj);
    };

    Component.prototype.removeStylishCQListener = function() {
      this.stylishCQWrapper.removeChild(this.stylishCQResizeListener);
    };

    Component.prototype.handleStylishCQListenerResize = function() {
      let width = this.stylishCQWrapper.clientWidth;
      let matchingQueries = Object.keys(queries).reduce((matches, query) => {
        let descriptor = queries[query];
        if (width >= descriptor.min && width <= descriptor.max) {
          matches.push(query);
        }

        return matches;
      }, []);

      this.setStylishState({
        containerQueriesLoaded: true,
        containerQueries: matchingQueries,
      });
    };

    Component.prototype.handleStylishCQListenerLoad = function(event) {
      let content = event.target.contentDocument.defaultView;
      content.addEventListener('resize', () => this.handleStylishCQListenerResize());
      this.handleStylishCQListenerResize();
    };

    Component.prototype.render = function() {
      return (
        <div
          style={{position: 'relative', visibility: this.stylishState.containerQueriesLoaded ? null : 'hidden'}}
          ref={(component) => this.stylishCQWrapper = component}
        >
          {render.call(this)}
        </div>
      );
    };

    return Component;
  },

  reset() {
    cache = {};
  },
};

export default ContainerQueriesPlugin;
