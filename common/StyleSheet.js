import * as _ from './utilities';
import config from './config';
// import {applyCreatePlugins} from '../plugins/apply-plugins';

let stylesheetIndex = 1;

class Rule {
  constructor(base) {
    Object.defineProperty(this, 'base', {
      value: base ? resolveComponentRules(base) : [],
      enumerable: false,
    });
  }

  variation(...args) {
    if (args.length === 3) {
      let [name, value, rules] = args;
      this[name] = this[name] || {};
      this[name][value] = resolveComponentRules(rules);
    } else {
      let [name, rules] = args;
      this[name] = this[name] || {};
      this[name].true = resolveComponentRules(rules);
    }
  }
}

export default class StyleSheet {
  rules = {};
  variationDetails = {};
  id = stylesheetIndex++;

  constructor(baseRules = {}) {
    if (Object.keys(baseRules).length) { this.base(baseRules); }
  }

  add(rules, {base = false} = {}) {
    Object.keys(rules).forEach((name) => {
      if (base) {
        this.rules[name] = new Rule(rules[name]);

        // this[name] = this.for(name);
        this[name] = this[name] || rules[name];

        return;
      }

      let variationRules = rules[name];
      // Boolean properties are in the form {component: {rules}}
      // Non-boolean properties are in the form {val: {component: {rules}}}
      let isBoolean = (depth(variationRules) < 3);
      this.variationDetails[name] = {isBoolean};

      if (isBoolean) {
        Object.keys(variationRules).forEach((component) => {
          let componentRule = this.rules[component] || new Rule();
          componentRule.variation(name, variationRules[component]);
          this.rules[component] = componentRule;
        });
      } else {
        Object.keys(variationRules).forEach((variationValue) => {
          let variationValueRules = variationRules[variationValue];

          Object.keys(variationValueRules).forEach((component) => {
            let componentRule = this.rules[component] || new Rule();
            componentRule.variation(name, variationValue, variationValueRules[component]);
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

function resolveComponentRules(rules) {
  let componentRules = {base: []};

  _.asArray(rules).forEach((rule) => {
    if (!_.isObject(rule)) {
      componentRules.base.push(finalRuleResolution(rule));
      return;
    }

    config.plugins
      .filter((plugin) => Boolean(plugin.add))
      .forEach((plugin) => {
        let result = plugin.add(rule);

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
