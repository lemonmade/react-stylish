import * as _ from './utilities';
import config from './config';

let stylesheetIndex = 1;

class Rule {
  constructor(base = {base: []}) {
    Object.defineProperty(this, 'base', {
      value: base,
      enumerable: false,
    });
  }

  variation(...args) {
    if (args.length === 3) {
      let [name, value, rules] = args;
      this[name] = this[name] || {};
      this[name][value] = rules;
    } else {
      let [name, rules] = args;
      this[name] = this[name] || {};
      this[name].true = rules;
    }
  }
}

export default class StyleSheet {
  rules = {};
  variationDetails = {};
  isSingleComponent = false;
  id = stylesheetIndex++;

  constructor(baseRules = {}) {
    if (Object.keys(baseRules).length) { this.base(baseRules); }
  }

  add(rules, {base = false} = {}) {
    if (base) {
      let isSingleComponent = (depth(rules) < 2);

      if (isSingleComponent) {
        this.isSingleComponent = true;
        rules = {root: rules};
      }

      Object.keys(rules).forEach((component) => {
        this.rules[component] = new Rule(resolveComponentRules(rules[component], {
          component,
          stylesheet: this,
        }));

        this[component] = this[component] || this.rules[component].base.base.filter((rule) => !_.isFunction(rule))[0];
      });

      return this;
    }

    Object.keys(rules).forEach((variation) => {
      let variationRules = rules[variation];
      let {isSingleComponent} = this;
      let enumerableDepth = isSingleComponent ? 2 : 3;
      // Boolean properties are in the form {component: {rules}}
      // Non-boolean properties are in the form {val: {component: {rules}}}
      let isBoolean = (depth(variationRules) < enumerableDepth);
      this.variationDetails[variation] = {isBoolean};

      if (isBoolean) {
        if (isSingleComponent) { variationRules = {root: variationRules}; }

        Object.keys(variationRules).forEach((component) => {
          let componentRule = this.rules[component] || new Rule();
          componentRule.variation(variation, resolveComponentRules(variationRules[component], {
            component,
            stylesheet: this,
          }));
          this.rules[component] = componentRule;
        });
      } else {
        Object.keys(variationRules).forEach((variationValue) => {
          let variationValueRules = variationRules[variationValue];
          if (isSingleComponent) { variationValueRules = {root: variationValueRules}; }

          Object.keys(variationValueRules).forEach((component) => {
            let componentRule = this.rules[component] || new Rule();
            componentRule.variation(variation, variationValue, resolveComponentRules(variationValueRules[component], {
              component,
              stylesheet: this,
            }));
            this.rules[component] = componentRule;
          });
        });
      }
    });

    return this;
  }

  base(rules) {
    return this.add(rules, {base: true});
  }

  variation(variation, rules) {
    return this.variations({[variation]: rules});
  }

  variations(rules) {
    return this.add(rules);
  }
}

function reserved(key, value) {
  let options = {pseudo: config.pseudo};
  return config.plugins.some((plugin) => plugin.reserve && plugin.reserve(key, value, options));
}

function depth(object) {
  if (_.isArray(object) || _.isFunction(object)) { return 1; }
  if (!_.isObject(object)) { return 0; }

  let firstKey = Object.keys(object)[0];
  return 1 + ((firstKey === 'transform' || reserved(firstKey, object[firstKey])) ? 0 : depth(object[firstKey]));
}

function createRule(rule, options) {
  options.React = config.React;

  config.plugins
    .filter((plugin) => Boolean(plugin.create))
    .forEach((plugin) => {
      rule = plugin.create(rule, options);
    });

  return rule;
}

function finalRuleResolution(rule) {
  if (_.isObject(rule)) {
    return createRule(rule, {dynamic: false});
  } else if (_.isFunction(rule)) {
    return (context) => createRule(rule.call(context, context), {dynamic: true});
  } else {
    return rule;
  }
}

function resolveComponentRules(rules, {component, stylesheet}) {
  let options = {component, stylesheet, pseudo: config.pseudo};
  let componentRules = {base: []};

  _.asArray(rules).forEach((rule) => {
    if (!_.isObject(rule)) {
      componentRules.base.push(finalRuleResolution(rule));
      return;
    }

    config.plugins
      .filter((plugin) => Boolean(plugin.add))
      .forEach((plugin) => {
        let result = plugin.add(rule, options);

        Object.keys(result).forEach((ruleKey) => {
          let relevantRules = result[ruleKey];

          if (ruleKey === 'base') {
            rule = relevantRules;
            return;
          }

          componentRules[ruleKey] = _.asArray(relevantRules).map(finalRuleResolution);
        });
      });

    componentRules.base.push(finalRuleResolution(rule));
  });

  return componentRules;
}
