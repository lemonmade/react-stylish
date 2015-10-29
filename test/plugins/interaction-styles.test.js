import '../helper';
import StyleSheet from '../../src/common/StyleSheet';
import InteractionStylesPlugin from '../../src/plugins/interaction-styles';

describe('plugins', () => {
  describe('InteractionStylesPlugin', () => {
    const INTERACTION_STATES = ['hover', 'focus', 'active'];
    const interactionRule = Object.freeze({background: 'gray'});
    const regularRule = Object.freeze({background: 'white'});
    const component = 'button';
    const stylesheet = new StyleSheet();

    beforeEach(() => {
      InteractionStylesPlugin.reset();
    });

    describe('.reserve', () => {
      INTERACTION_STATES.forEach((state) => {
        it(`reserves '${state}' rules`, () => {
          expect(InteractionStylesPlugin.reserve(state, interactionRule)).to.be.true;
        });

        it(`reserves ':${state}' rules in pseudo mode`, () => {
          expect(InteractionStylesPlugin.reserve(`:${state}`, interactionRule, {pseudo: true})).to.be.true;
        });

        it(`does not reserve '${state}' rules in pseudo mode`, () => {
          expect(InteractionStylesPlugin.reserve(state, interactionRule, {pseudo: true})).to.be.false;
        });
      });

      it('does not reserve other rules', () => {
        expect(InteractionStylesPlugin.reserve('backgroundColor', 'red')).to.be.false;
      });
    });

    describe('.add', () => {
      INTERACTION_STATES.forEach((state) => {
        it(`extracts '${state}' rules`, () => {
          let rule = {...regularRule, [state]: interactionRule};
          let expected = {base: regularRule, [state]: interactionRule};
          let result = InteractionStylesPlugin.add(rule, {stylesheet, component});

          expect(result).to.deep.equal(expected);
        });

        it(`extracts ':${state}' rules in pseudo mode`, () => {
          let rule = {...regularRule, [`:${state}`]: interactionRule};
          let expected = {base: regularRule, [state]: interactionRule};
          let result = InteractionStylesPlugin.add(rule, {stylesheet, component, pseudo: true});

          expect(result).to.deep.equal(expected);
        });
      });
    });

    describe('.resolve', () => {
      let stylishState = null;
      let rules = null;

      function resolve(theRules, options = {stylishState, component}) {
        return InteractionStylesPlugin.resolve(theRules, options);
      }

      beforeEach(() => {
        stylishState = {interactions: {hover: {}, focus: {}, active: {}}};
        rules = {base: []};
      });

      it('does not throw an error when no state has previously been set', () => {
        delete stylishState.interactions;
        expect(() => resolve(rules)).not.to.throw(Error);
      });

      describe('with hover', () => {
        beforeEach(() => {
          rules.hover = [interactionRule];
        });

        it('adds hover rules when the hover state is true', () => {
          stylishState.interactions.hover[component] = true;
          let result = resolve(rules);
          expect(result).to.deep.equal([interactionRule]);
        });

        it('does not add hover rules when the hover state is false', () => {
          stylishState.interactions.hover[component] = false;
          let result = resolve(rules);
          expect(result).to.be.empty;
        });
      });

      describe('with focus', () => {
        beforeEach(() => {
          rules.focus = [interactionRule];
        });

        it('adds focus rules when the focus state is true', () => {
          stylishState.interactions.focus[component] = true;
          let result = resolve(rules);
          expect(result).to.deep.equal([interactionRule]);
        });

        it('does not add focus rules when the focus state is false', () => {
          stylishState.interactions.focus[component] = false;
          let result = resolve(rules);
          expect(result).to.be.empty;
        });
      });

      describe('with hover', () => {
        beforeEach(() => {
          rules.hover = [interactionRule];
        });

        it('adds hover rules when the hover state is true', () => {
          stylishState.interactions.hover[component] = true;
          let result = resolve(rules);
          expect(result).to.deep.equal([interactionRule]);
        });

        it('does not add hover rules when the hover state is false', () => {
          stylishState.interactions.hover[component] = false;
          let result = resolve(rules);
          expect(result).to.be.empty;
        });
      });
    });

    describe('.augment', () => {
      let setState = null;
      let stylishState = null;

      function augment(oldProps = {}) {
        return InteractionStylesPlugin.augment(oldProps, {stylishState, setState, component, stylesheet});
      }

      beforeEach(() => {
        setState = sinon.spy();
        stylishState = {interactions: {hover: {}, focus: {}, active: {}}};
      });

      it('does not throw an error when no state has previously been set', () => {
        delete stylishState.interactions;
        expect(() => augment()).not.to.throw(Error);
      });

      it('does not add any listeners by default', () => {
        InteractionStylesPlugin.reset();
        expect(augment()).to.deep.equal({});
      });

      it('adds listeners for multiple interaction styles', () => {
        InteractionStylesPlugin.add({focus: interactionRule}, {stylesheet, component});
        InteractionStylesPlugin.add({hover: interactionRule}, {stylesheet, component});

        let props = augment();
        expect(props.onFocus).to.be.a('function');
        expect(props.onBlur).to.be.a('function');
        expect(props.onMouseEnter).to.be.a('function');
        expect(props.onMouseLeave).to.be.a('function');
      });

      describe('with hover', () => {
        beforeEach(() => {
          InteractionStylesPlugin.add({hover: interactionRule}, {stylesheet, component});
        });

        it('adds an onMouseEnter listener', () => {
          let props = augment();
          expect(props.onMouseEnter).to.be.a('function');
        });

        it('mouseEnter calls setState with the hover status of that component set to true', () => {
          let props = augment();
          props.onMouseEnter();
          let newState = setState.lastCall.args[0];
          expect(newState.interactions.hover[component]).to.be.true;
        });

        it('mouseEnter overrides and calls an originally-set onMouseEnter handler', () => {
          let mouseEnter = sinon.spy();
          let event = {x: 0, y: 0};

          let props = augment({onMouseEnter: mouseEnter});

          props.onMouseEnter(event);
          expect(mouseEnter).to.have.been.calledWith(event);
        });

        it('adds an onMouseLeave listener', () => {
          let props = augment();
          expect(props.onMouseLeave).to.be.a('function');
        });

        it('mouseLeave calls setState with the hover status of that component set to false', () => {
          let props = augment();
          props.onMouseLeave();
          let newState = setState.lastCall.args[0];
          expect(newState.interactions.hover[component]).to.be.false;
        });

        it('mouseLeave overrides and calls an originally-set onMouseLeave handler', () => {
          let mouseLeave = sinon.spy();
          let event = {x: 0, y: 0};
          let props = augment({onMouseLeave: mouseLeave});

          props.onMouseLeave(event);
          expect(mouseLeave).to.have.been.calledWith(event);
        });

        it('does not add listeners when there is no hover', () => {
          InteractionStylesPlugin.reset();
          let props = augment();
          expect(props.onMouseEnter).to.be.undefined;
          expect(props.onMouseLeave).to.be.undefined;
        });
      });

      describe('with focus', () => {
        beforeEach(() => {
          InteractionStylesPlugin.add({focus: interactionRule}, {stylesheet, component});
        });

        it('adds an onFocus listener', () => {
          let props = augment();
          expect(props.onFocus).to.be.a('function');
        });

        it('focus calls setState with the focus status of that component set to true', () => {
          let props = augment();
          props.onFocus();
          let newState = setState.lastCall.args[0];
          expect(newState.interactions.focus[component]).to.be.true;
        });

        it('focus overrides and calls an originally-set onFocus handler', () => {
          let focus = sinon.spy();
          let event = {x: 0, y: 0};
          let props = augment({onFocus: focus});

          props.onFocus(event);
          expect(focus).to.have.been.calledWith(event);
        });

        it('adds an onBlur listener', () => {
          let props = augment();
          expect(props.onBlur).to.be.a('function');
        });

        it('blur calls setState with the focus status of that component set to false', () => {
          let props = augment();
          props.onBlur();
          let newState = setState.lastCall.args[0];
          expect(newState.interactions.focus[component]).to.be.false;
        });

        it('blur overrides and calls an originally-set onBlur handler', () => {
          let blur = sinon.spy();
          let event = {x: 0, y: 0};
          let props = augment({onBlur: blur});

          props.onBlur(event);
          expect(blur).to.have.been.calledWith(event);
        });

        it('does not add listeners when there is no focus', () => {
          InteractionStylesPlugin.reset();
          let props = augment();
          expect(props.onFocus).to.be.undefined;
          expect(props.onBlur).to.be.undefined;
        });
      });

      describe('with active', () => {
        beforeEach(() => {
          InteractionStylesPlugin.add({active: interactionRule}, {stylesheet, component});
        });

        it('adds an onKeyDown listener', () => {
          let props = augment();
          expect(props.onKeyDown).to.be.a('function');
        });

        it('calls setState on keyDown with the active status of that component set to true when the key is space', () => {
          let props = augment();
          props.onKeyDown({key: ' '});
          let newState = setState.lastCall.args[0];
          expect(newState.interactions.active[component]).to.be.true;
        });

        it('calls setState on keyDown with the active status of that component set to true when the key is Enter', () => {
          let props = augment();
          props.onKeyDown({key: 'Enter'});
          let newState = setState.lastCall.args[0];
          expect(newState.interactions.active[component]).to.be.true;
        });

        it('does not call setState on keyDown when the key is anything else', () => {
          let props = augment();
          props.onKeyDown({key: 'A'});
          expect(setState).not.to.have.been.called;
        });

        it('keyDown overrides and calls an originally-set onKeyDown handler', () => {
          let keyDown = sinon.spy();
          let event = {key: 'A'};
          let props = augment({onKeyDown: keyDown});

          props.onKeyDown(event);
          expect(keyDown).to.have.been.calledWith(event);
        });

        it('adds an onKeyUp listener', () => {
          let props = augment();
          expect(props.onKeyUp).to.be.a('function');
        });

        it('calls setState on keyUp with the active status of that component set to false when the key is space', () => {
          let props = augment();
          props.onKeyUp({key: ' '});
          let newState = setState.lastCall.args[0];
          expect(newState.interactions.active[component]).to.be.false;
        });

        it('calls setState on keyUp with the active status of that component set to false when the key is Enter', () => {
          let props = augment();
          props.onKeyUp({key: 'Enter'});
          let newState = setState.lastCall.args[0];
          expect(newState.interactions.active[component]).to.be.false;
        });

        it('does not call setState on keyUp when the key is anything else', () => {
          let props = augment();
          props.onKeyUp({key: 'A'});
          expect(setState).not.to.have.been.called;
        });

        it('keyUp overrides and calls an originally-set onKeyUp handler', () => {
          let keyUp = sinon.spy();
          let event = {key: 'A'};
          let props = augment({onKeyUp: keyUp});

          props.onKeyUp(event);
          expect(keyUp).to.have.been.calledWith(event);
        });

        it('adds an onMouseDown listener', () => {
          let props = augment();
          expect(props.onMouseDown).to.be.a('function');
        });

        it('mouseDown calls setState with the active status of that component set to true', () => {
          let props = augment();
          props.onMouseDown();
          let newState = setState.lastCall.args[0];
          expect(newState.interactions.active[component]).to.be.true;
        });

        it('mouseDown overrides and calls an originally-set onMouseDown handler', () => {
          let mouseDown = sinon.spy();
          let event = {x: 0, y: 0};
          let props = augment({onMouseDown: mouseDown});

          props.onMouseDown(event);
          expect(mouseDown).to.have.been.calledWith(event);
        });

        it('sets the active state to false on mouseUp', () => {
          stylishState.interactions.active[component] = true;
          augment();

          let event = document.createEvent('MouseEvents');
          event.initEvent('mouseup', true, true);
          document.body.dispatchEvent(event);

          let newState = setState.lastCall.args[0];
          expect(newState.interactions.active[component]).to.be.false;
        });
      });
    });
  });
});
