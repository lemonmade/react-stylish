import * as _ from './utilities';
import {applyCreatePlugins} from '../plugins/apply-plugins';

const INTERACTION_STATES = ['hover', 'active', 'focus'];

class StyleSheet {
  constructor(baseRules = {}) {
    this.componentRules = {};
    this.variationRules = {};
    this.interactions = {};
    this.context = {};

    if (Object.keys(baseRules).length) { this.add(baseRules, {base: true}); }
  }

  add(rules, {base = false} = {}) {
    Object.keys(rules).forEach((name) => {
      if (base) {
        let componentRules = resolveComponentRules(rules[name]);
        checkInteractions(componentRules, name, this.interactions);
        this.componentRules[name] = {name, rules: componentRules};
        this[name] = this.for(name);
        return;
      }

      let variationRules = rules[name];
      // Boolean properties are in the form {component: {rules}}
      // Non-boolean properties are in the form {val: {component: {rules}}}
      let isBoolean = depth(variationRules) < 3;
      let variation = this.variationRules[name] || {name, isBoolean, rules: {}};

      if (isBoolean) {
        variation.rules.true = {};

        Object.keys(variationRules).forEach((component) => {
          let componentRules = resolveComponentRules(variationRules[component]);
          checkInteractions(componentRules, component, this.interactions);
          variation.rules.true[component] = componentRules;
        });
      } else {
        Object.keys(variationRules).forEach((variationValue) => {
          variation.rules[variationValue] = {};
          let variationValueRules = variationRules[variationValue];

          Object.keys(variationValueRules).forEach((component) => {
            let componentRules = resolveComponentRules(variationValueRules[component]);
            checkInteractions(componentRules, component, this.interactions);
            variation.rules[variationValue][component] = componentRules;
          });
        });
      }

      this.variationRules[name] = variation;
    });

    return this;
  }

  attach(newContext) { this.context = newContext; }

  base(rules) {
    return this.add(rules, {base: true});
  }

  variation(variation, rules) {
    return this.variations({[variation]: rules});
  }

  variations(rules) {
    return this.add(rules);
  }

  for(component, variationMapping = {}) {
    let {componentRules, variationRules, context} = this;

    componentRules = componentRules[component] && componentRules[component].rules;
    let props = context.props || {};
    let state = context.state || {};
    let stylishState = state._StylishState;

    let matchedRules = [];

    matchedRules.push(...selectComponentRules(component, componentRules, stylishState, context));

    Object.keys(variationRules).forEach((variationName) => {
      let variation = variationRules[variationName];

      let contextValue = (() => {
        let {name} = variation;
        if (variationMapping[name] != null) { return variationMapping[name]; }
        if (state[name] != null) { return state[name]; }
        return props[name];
      })();

      let variationValue = String(variation.isBoolean ? Boolean(contextValue) : contextValue);
      let variationComponentRules = variation.rules[variationValue] && variation.rules[variationValue][component];

      matchedRules.push(...selectComponentRules(component, variationComponentRules, stylishState, context));
    });

    return _.compact(matchedRules);
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
