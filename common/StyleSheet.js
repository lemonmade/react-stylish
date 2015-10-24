import * as _ from './utilities';
// import {applyCreatePlugins} from '../plugins/apply-plugins';

function applyCreatePlugins() {}

const INTERACTION_STATES = ['hover', 'active', 'focus'];

let stylesheetIndex = 1;

class StyleSheet {
  constructor(baseRules = {}) {
    this.rules = {base: {}};
    this.id = stylesheetIndex++;
    if (Object.keys(baseRules).length) { this.add(baseRules, {base: true}); }
  }

  add(rules, {base = false} = {}) {
    Object.keys(rules).forEach((name) => {
      if (base) {
        let componentRules = resolveComponentRules(rules[name]);
        this.rules.base[name] = {name, rules: componentRules};
        this[name] = this.for(name);
        return;
      }

      let variationRules = rules[name];
      // Boolean properties are in the form {component: {rules}}
      // Non-boolean properties are in the form {val: {component: {rules}}}
      let isBoolean = depth(variationRules) < 3;
      let variation = this.rules[name] || {name, isBoolean, rules: {}};

      if (isBoolean) {
        variation.rules.true = {};

        Object.keys(variationRules).forEach((component) => {
          let componentRules = resolveComponentRules(variationRules[component]);
          variation.rules.true[component] = componentRules;
        });
      } else {
        Object.keys(variationRules).forEach((variationValue) => {
          variation.rules[variationValue] = {};
          let variationValueRules = variationRules[variationValue];

          Object.keys(variationValueRules).forEach((component) => {
            let componentRules = resolveComponentRules(variationValueRules[component]);
            variation.rules[variationValue][component] = componentRules;
          });
        });
      }

      this.rules[name] = variation;
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

function depth(object) {
  if (_.isArray(object) || _.isFunction(object)) { return 1; }
  if (!_.isObject(object)) { return 0; }

  let firstKey = Object.keys(object)[0];
  return 1 + ((firstKey === 'transform' || INTERACTION_STATES.indexOf(firstKey) >= 0) ? 0 : depth(object[firstKey]));
}

function finalRuleResolution(rule) {
  if (_.isObject(rule)) {
    return applyCreatePlugins({rule, dynamic: false});
  } else if (_.isFunction(rule)) {
    return (context) => applyCreatePlugins({rule: rule.call(context, context), dynamic: true});
  } else {
    return rule;
  }
}

function resolveComponentRules(rules) {
  let resolvedRules = {base: []};

  _.asArray(rules).forEach((rule) => {
    if (_.isObject(rule)) {
      Object.keys(rule).forEach((interactionState) => {
        if (INTERACTION_STATES.indexOf(interactionState) < 0) { return; }

        let interactionRules = rule[interactionState];
        delete rule[interactionState];

        resolvedRules[interactionState] = _.asArray(interactionRules).map(finalRuleResolution);
      });

      if (Object.keys(rule).length) { resolvedRules.base.push(finalRuleResolution(rule)); }
    } else {
      resolvedRules.base.push(finalRuleResolution(rule));
    }
  });

  return resolvedRules;
}

function selectComponentRules(component, rules, stylishState, context) {
  let matchedRules = [];
  if (!rules) { return matchedRules; }

  function ruleMapper(rule) { return compiledRule(rule, context); }
  matchedRules.push(...rules.base.map(ruleMapper));

  if (!stylishState) { return matchedRules; }

  Object.keys(rules).forEach((interactionState) => {
    let componentInteractionRules = rules[interactionState];

    if (interactionState === 'base') { return; }
    if (!stylishState[interactionState][component]) { return; }

    matchedRules.push(...componentInteractionRules.map(ruleMapper));
  });

  return matchedRules;
}

function checkInteractions(rules, component, interactions) {
  interactions[component] = interactions[component] || {};

  INTERACTION_STATES
    .filter((state) => rules[state])
    .forEach((state) => interactions[component][state] = true);
}

function compiledRule(rule, context) {
  if (_.isFunction(rule)) {
    if (!context.state && !context.props) { return null; }
    return rule.call(context, context);
  } else {
    return rule;
  }
}

export default StyleSheet;
