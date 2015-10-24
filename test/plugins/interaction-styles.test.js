import '../helper';
import StyleSheet from '../../common/StyleSheet';
import InteractionStylesPlugin from '../../plugins/interaction-styles';

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

    describe('.add', () => {
      INTERACTION_STATES.forEach((state) => {
        it(`Extracts '${state}' rules`, () => {
          let rule = {...regularRule, [state]: interactionRule};
          let expected = {base: regularRule, [state]: interactionRule};
          let result = InteractionStylesPlugin.add({rule, stylesheet, component});

          expect(result).to.deep.equal(expected);
        });
      });
    });

    describe('.resolve', () => {
      let setState = null;
      let props = null;
      let state = null;
      let rules = null;

      function resolve(options) {
        options.state = options.state || state;
        options.props = options.props || props;
        options.setState = options.setState || setState;
        options.component = options.component || component;
        options.stylesheet = options.stylesheet || stylesheet;

        return InteractionStylesPlugin.resolve(options);
      }

      beforeEach(() => {
        setState = sinon.spy();
        props = {};
        state = {interactions: {hover: {}, focus: {}, active: {}}};
      });

      it('does not throw an error when no state has previously been set', () => {
        delete state.interactions;
        expect(() => resolve({rules})).not.to.throw(Error);
      });

      it('does not overwrite state cache on subsequent adds', () => {
        InteractionStylesPlugin.add({rule: {focus: interactionRule}, stylesheet, component});
        InteractionStylesPlugin.add({rule: {active: interactionRule}, stylesheet, component});

        // focus shouldn't be false, so it should add onFocus
        resolve({rules});
        expect(props.onFocus).to.be.a('function');
      });

      describe('with hover', () => {
        beforeEach(() => {
          InteractionStylesPlugin.add({rule: {hover: interactionRule}, stylesheet, component});
          rules = {hover: interactionRule};
        });

        it('adds hover rules when the hover state is true', () => {
          state.interactions.hover[component] = true;
          let result = resolve({rules});
          expect(result).to.deep.equal([interactionRule]);
        });

        it('does not add hover rules when the hover state is false', () => {
          state.interactions.hover[component] = false;
          let result = resolve({rules});
          expect(result).to.be.empty;
        });

        it('adds an onMouseEnter listener', () => {
          resolve({rules});
          expect(props.onMouseEnter).to.be.a('function');
        });

        it('mouseEnter calls setState with the hover status of that component set to true', () => {
          resolve({rules});
          props.onMouseEnter();
          let newState = setState.lastCall.args[0];
          expect(newState.interactions.hover[component]).to.be.true;
        });

        it('mouseEnter overrides and calls an originally-set onMouseEnter handler', () => {
          let mouseEnter = sinon.spy();
          let event = {x: 0, y: 0};
          props.onMouseEnter = mouseEnter;

          resolve({rules});

          props.onMouseEnter(event);
          expect(mouseEnter).to.have.been.calledWith(event);
        });

        it('adds an onMouseLeave listener', () => {
          resolve({rules});
          expect(props.onMouseLeave).to.be.a('function');
        });

        it('mouseLeave calls setState with the hover status of that component set to false', () => {
          resolve({rules});
          props.onMouseLeave();
          let newState = setState.lastCall.args[0];
          expect(newState.interactions.hover[component]).to.be.false;
        });

        it('mouseLeave overrides and calls an originally-set onMouseLeave handler', () => {
          let mouseLeave = sinon.spy();
          let event = {x: 0, y: 0};
          props.onMouseLeave = mouseLeave;

          resolve({rules});

          props.onMouseLeave(event);
          expect(mouseLeave).to.have.been.calledWith(event);
        });

        it('does not add listeners when there is no hover', () => {
          InteractionStylesPlugin.reset();
          resolve({rules});
          expect(props.onMouseEnter).to.be.undefined;
          expect(props.onMouseLeave).to.be.undefined;
        });
      });

      describe('with focus', () => {
        beforeEach(() => {
          InteractionStylesPlugin.add({rule: {focus: interactionRule}, stylesheet, component});
          rules = {focus: interactionRule};
        });

        it('adds focus rules when the focus state is true', () => {
          state.interactions.focus[component] = true;
          let result = resolve({rules});
          expect(result).to.deep.equal([interactionRule]);
        });

        it('does not add focus rules when the focus state is false', () => {
          state.interactions.focus[component] = false;
          let result = resolve({rules});
          expect(result).to.be.empty;
        });

        it('adds an onFocus listener', () => {
          resolve({rules});
          expect(props.onFocus).to.be.a('function');
        });

        it('focus calls setState with the focus status of that component set to true', () => {
          resolve({rules});
          props.onFocus();
          let newState = setState.lastCall.args[0];
          expect(newState.interactions.focus[component]).to.be.true;
        });

        it('focus overrides and calls an originally-set onFocus handler', () => {
          let focus = sinon.spy();
          let event = {x: 0, y: 0};
          props.onFocus = focus;

          resolve({rules});

          props.onFocus(event);
          expect(focus).to.have.been.calledWith(event);
        });

        it('adds an onBlur listener', () => {
          resolve({rules});
          expect(props.onBlur).to.be.a('function');
        });

        it('blur calls setState with the focus status of that component set to false', () => {
          resolve({rules});
          props.onBlur();
          let newState = setState.lastCall.args[0];
          expect(newState.interactions.focus[component]).to.be.false;
        });

        it('blur overrides and calls an originally-set onBlur handler', () => {
          let blur = sinon.spy();
          let event = {x: 0, y: 0};
          props.onBlur = blur;

          resolve({rules});

          props.onBlur(event);
          expect(blur).to.have.been.calledWith(event);
        });

        it('does not add listeners when there is no focus', () => {
          InteractionStylesPlugin.reset();
          resolve({rules});
          expect(props.onFocus).to.be.undefined;
          expect(props.onBlur).to.be.undefined;
        });
      });

      describe('with active', () => {
        beforeEach(() => {
          InteractionStylesPlugin.add({rule: {active: interactionRule}, stylesheet, component});
          rules = {active: interactionRule};
        });

        it('adds active rules when the active state is true', () => {
          state.interactions.active[component] = true;
          let result = resolve({rules});
          expect(result).to.deep.equal([interactionRule]);
        });

        it('does not add active rules when the active state is false', () => {
          state.interactions.active[component] = false;
          let result = resolve({rules});
          expect(result).to.be.empty;
        });

        it('adds an onKeyDown listener', () => {
          resolve({rules});
          expect(props.onKeyDown).to.be.a('function');
        });

        it('calls setState on keyDown with the active status of that component set to true when the key is space', () => {
          resolve({rules});
          props.onKeyDown({key: ' '});
          let newState = setState.lastCall.args[0];
          expect(newState.interactions.active[component]).to.be.true;
        });

        it('calls setState on keyDown with the active status of that component set to true when the key is Enter', () => {
          resolve({rules});
          props.onKeyDown({key: 'Enter'});
          let newState = setState.lastCall.args[0];
          expect(newState.interactions.active[component]).to.be.true;
        });

        it('does not call setState on keyDown when the key is anything else', () => {
          resolve({rules});
          props.onKeyDown({key: 'A'});
          expect(setState).not.to.have.been.called;
        });

        it('keyDown overrides and calls an originally-set onKeyDown handler', () => {
          let keyDown = sinon.spy();
          let event = {key: 'A'};
          props.onKeyDown = keyDown;

          resolve({rules});

          props.onKeyDown(event);
          expect(keyDown).to.have.been.calledWith(event);
        });

        it('adds an onKeyUp listener', () => {
          resolve({rules});
          expect(props.onKeyUp).to.be.a('function');
        });

        it('calls setState on keyUp with the active status of that component set to false when the key is space', () => {
          resolve({rules});
          props.onKeyUp({key: ' '});
          let newState = setState.lastCall.args[0];
          expect(newState.interactions.active[component]).to.be.false;
        });

        it('calls setState on keyUp with the active status of that component set to false when the key is Enter', () => {
          resolve({rules});
          props.onKeyUp({key: 'Enter'});
          let newState = setState.lastCall.args[0];
          expect(newState.interactions.active[component]).to.be.false;
        });

        it('does not call setState on keyUp when the key is anything else', () => {
          resolve({rules});
          props.onKeyUp({key: 'A'});
          expect(setState).not.to.have.been.called;
        });

        it('keyUp overrides and calls an originally-set onKeyUp handler', () => {
          let keyUp = sinon.spy();
          let event = {key: 'A'};
          props.onKeyUp = keyUp;

          resolve({rules});

          props.onKeyUp(event);
          expect(keyUp).to.have.been.calledWith(event);
        });

        it('adds an onMouseDown listener', () => {
          resolve({rules});
          expect(props.onMouseDown).to.be.a('function');
        });

        it('mouseDown calls setState with the active status of that component set to true', () => {
          resolve({rules});
          props.onMouseDown();
          let newState = setState.lastCall.args[0];
          expect(newState.interactions.active[component]).to.be.true;
        });

        it('mouseDown overrides and calls an originally-set onMouseDown handler', () => {
          let mouseDown = sinon.spy();
          let event = {x: 0, y: 0};
          props.onMouseDown = mouseDown;

          resolve({rules});

          props.onMouseDown(event);
          expect(mouseDown).to.have.been.calledWith(event);
        });

        it('sets the active state to false on mouseUp', () => {
          state.interactions.active[component] = true;
          resolve({rules});

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
