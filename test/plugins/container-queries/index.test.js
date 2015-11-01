import '../../helper';

import _ from 'lodash';
import React from 'react';
import TestUtils from 'react-addons-test-utils';

import ContainerQueriesPlugin from '../../../src/plugins/container-queries';
import createContainerQuery from '../../../src/plugins/container-queries/create';
import StyleSheet from '../../../src/common/StyleSheet';

describe('Plugins', () => {
  describe('ContainerQueriesPlugin', () => {
    const QUERY_KEY = createContainerQuery({min: 500});
    const component = 'button';
    const containerQueryRule = Object.freeze({backgroundColor: 'blue'});
    let stylesheet;

    beforeEach(() => {
      stylesheet = new StyleSheet();
      ContainerQueriesPlugin.reset();
    });

    describe('.reserve', () => {
      it('reserves a property starting with the prefix', () => {
        expect(ContainerQueriesPlugin.reserve(QUERY_KEY, {})).to.be.true;
      });

      it('does not reserve other properties', () => {
        expect(ContainerQueriesPlugin.reserve('backgroundColor', 'red')).to.be.false;
      });
    });

    describe('.add', () => {
      it('extracts container query rules', () => {
        let regularRule = {backgroundColor: 'red'};
        let expected = {base: regularRule, [QUERY_KEY]: containerQueryRule};
        let result = ContainerQueriesPlugin.add({...regularRule, [QUERY_KEY]: containerQueryRule}, {stylesheet, component});

        expect(result).to.deep.equal(expected);
      });
    });

    describe('.resolve', () => {
      it('adds a container query rule that is active', () => {
        let stylishState = {containerQueries: [QUERY_KEY]};
        let rules = {[QUERY_KEY]: containerQueryRule};
        expect(ContainerQueriesPlugin.resolve(rules, {stylishState})).to.deep.equal([containerQueryRule]);
      });

      it('does not add a container query rule that is not active', () => {
        let stylishState = {containerQueries: []};
        let rules = {[QUERY_KEY]: containerQueryRule};
        expect(ContainerQueriesPlugin.resolve(rules, {stylishState})).to.be.empty;
      });

      it('does not add a container a non-existent rule for an active query', () => {
        let stylishState = {containerQueries: [QUERY_KEY]};
        let rules = {};
        expect(_.compact(ContainerQueriesPlugin.resolve(rules, {stylishState}))).to.be.empty;
      });

      it('does not choke when no relevant state is set', () => {
        expect(ContainerQueriesPlugin.resolve({}, {stylishState: {}})).to.be.empty;
      });
    });

    describe('.decorate', () => {
      let Component;
      let DecoratedComponent;
      let clientWidth = sinon.stub().returns(500);

      beforeEach(() => {
        Component = class MyComponent {
          stylishCQWrapper = {
            appendChild: sinon.spy(),
            removeChild: sinon.spy(),
            get clientWidth() {
              return clientWidth();
            },
          };

          stylishCQResizeListener = {};

          setState() {}
          setStylishState() {}
          render() {}
        };
      });

      function decorateWithQueries() {
        ContainerQueriesPlugin.add({[QUERY_KEY]: containerQueryRule}, {stylesheet});
        return ContainerQueriesPlugin.decorate(Component, {stylesheet, React});
      }

      it('does not augment the class if there are no queries in the stylesheet', () => {
        let originalPrototype = {...Component.prototype};
        DecoratedComponent = ContainerQueriesPlugin.decorate(Component, {stylesheet, React});
        expect(DecoratedComponent.prototype).to.deep.equal(originalPrototype);
      });

      describe('#componentDidMount', () => {
        let objectStub;

        beforeEach(() => {
          objectStub = {
            setAttribute(attr, value) { this[attr] = value; },
            contentDocument: {
              defaultView: {
                addEventListener: sinon.spy(),
              },
            },
          };
          sinon.stub(document, 'createElement').returns(objectStub);
        });

        afterEach(() => {
          document.createElement.restore();
        });

        it('calls an original componentDidMount method', () => {
          let componentDidMount = sinon.spy();
          Component.prototype.componentDidMount = componentDidMount;
          DecoratedComponent = decorateWithQueries();

          let result = new DecoratedComponent();
          result.componentDidMount();

          expect(componentDidMount).to.have.been.calledOn(result);
        });

        it('creates and appends an empty, full-width object', () => {
          let expectedStyle = {
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
            overflow: 'hidden',
            'pointer-events': 'none',
            'z-index': -1,
          };

          DecoratedComponent = decorateWithQueries();
          new DecoratedComponent().componentDidMount();

          expect(objectStub).to.have.property('tabindex', '-1');
          expect(objectStub).to.have.property('data', 'about:blank');

          let style = objectStub.style;
          Object.keys(expectedStyle).forEach((property) => {
            expect(style).to.include(`${property}: ${expectedStyle[property]}`);
          });
        });

        it('appends the object to the wrapper', () => {
          DecoratedComponent = decorateWithQueries();
          let result = new DecoratedComponent();
          result.componentDidMount();

          expect(result.stylishCQWrapper.appendChild).to.have.been.calledWith(objectStub);
        });

        it('attaches and calls the resize listener on load', () => {
          DecoratedComponent = decorateWithQueries();
          let result = new DecoratedComponent();
          sinon.spy(result, 'handleStylishCQListenerResize');
          result.componentDidMount();

          objectStub.onload({target: objectStub});
          expect(result.handleStylishCQListenerResize).to.have.been.called;

          let resizeListenerArgs = objectStub.contentDocument.defaultView.addEventListener.lastCall.args;
          expect(resizeListenerArgs[0]).to.equal('resize');

          resizeListenerArgs[1]();
          expect(result.handleStylishCQListenerResize).to.have.been.calledTwice;
        });
      });

      describe('#handleStylishCQListenerResize', () => {
        const WIDTH = 500;
        let setStylishState;

        beforeEach(() => {
          setStylishState = sinon.spy();
          Component.prototype.setStylishState = setStylishState;
        });

        it('sets the containerQueriesLoaded state to true', () => {
          DecoratedComponent = decorateWithQueries();
          new DecoratedComponent().handleStylishCQListenerResize();

          expect(setStylishState.lastCall.args[0]).to.have.property('containerQueriesLoaded', true);
        });

        it('it includes container queries that match the current width', () => {
          const QUERY = createContainerQuery({min: WIDTH, max: WIDTH});
          ContainerQueriesPlugin.reset();
          ContainerQueriesPlugin.add({[QUERY]: containerQueryRule}, {stylesheet});
          DecoratedComponent = ContainerQueriesPlugin.decorate(Component, {stylesheet, React});

          clientWidth.returns(WIDTH);
          new DecoratedComponent().handleStylishCQListenerResize();

          expect(setStylishState.lastCall.args[0].containerQueries).to.deep.equal([QUERY]);
        });

        it('it does not include container queries that are smaller than the min', () => {
          const MIN_QUERY = createContainerQuery({min: WIDTH});
          ContainerQueriesPlugin.reset();
          ContainerQueriesPlugin.add({[MIN_QUERY]: containerQueryRule}, {stylesheet});
          DecoratedComponent = ContainerQueriesPlugin.decorate(Component, {stylesheet, React});

          clientWidth.returns(WIDTH - 1);
          new DecoratedComponent().handleStylishCQListenerResize();

          expect(setStylishState.lastCall.args[0].containerQueries).to.be.empty;
        });

        it('it does not include container queries that are larger than the max', () => {
          let MAX_QUERY = createContainerQuery({max: WIDTH});
          ContainerQueriesPlugin.reset();
          ContainerQueriesPlugin.add({[MAX_QUERY]: containerQueryRule}, {stylesheet});
          DecoratedComponent = ContainerQueriesPlugin.decorate(Component, {stylesheet, React});

          clientWidth.returns(WIDTH + 1);
          new DecoratedComponent().handleStylishCQListenerResize();

          expect(setStylishState.lastCall.args[0].containerQueries).to.be.empty;
        });
      });

      describe('#componentWillUnmount', () => {
        it('calls an original componentWillUnmount method', () => {
          let componentWillUnmount = sinon.spy();
          Component.prototype.componentWillUnmount = componentWillUnmount;
          DecoratedComponent = decorateWithQueries();

          let result = new DecoratedComponent();
          result.componentWillUnmount();

          expect(componentWillUnmount).to.have.been.calledOn(result);
        });

        it('removes the resize listener', () => {
          DecoratedComponent = decorateWithQueries();
          let result = new DecoratedComponent();
          result.componentWillUnmount();

          expect(result.stylishCQWrapper.removeChild).to.have.been.calledWith(result.stylishCQResizeListener);
        });
      });

      describe('#render', () => {
        const rendered = <div />;

        beforeEach(() => {
          Component = class MyComponent extends React.Component {
            setStylishState(newState) {
              this.setState({_StylishState: {...this.stylishState, newState}});
            }

            render() {
              return rendered;
            }
          };

          Component.prototype.stylishState = {};
        });

        it('wraps the original render result in a wrapper stored on the component', () => {
          let originalRender = sinon.stub().returns(rendered);
          Component.prototype.render = originalRender;
          DecoratedComponent = decorateWithQueries();
          let example = new DecoratedComponent();
          let result = example.render();

          expect(originalRender).to.have.been.calledOn(example);
          expect(result.props.style.position).to.equal('relative');
          expect(result.props.children).to.equal(rendered);
        });

        it('hides the container if the first resize has not happened yet', () => {
          DecoratedComponent = decorateWithQueries();
          let tree = TestUtils.renderIntoDocument(<DecoratedComponent />);
          expect(tree.stylishCQWrapper.style.visibility).to.equal('hidden');
        });

        it('shows the container if the resize has happened', () => {
          DecoratedComponent = decorateWithQueries();
          DecoratedComponent.prototype.stylishState = {containerQueriesLoaded: true};
          let tree = TestUtils.renderIntoDocument(<DecoratedComponent />);
          expect(tree.stylishCQWrapper.style.visibility).to.be.empty;
        });
      });
    });
  });
});
