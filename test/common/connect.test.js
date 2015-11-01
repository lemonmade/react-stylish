import '../helper';

import React from 'react';

import config, {configure} from '../../src/common/config';
import {createConnector} from '../../src/common/connect';
import StyleSheet from '../../src/common/StyleSheet';

describe('connect', () => {
  let Example;
  let ConnectedExample;
  let rendered;
  let resolver;
  let connect;
  let stylesheet = new StyleSheet();

  beforeEach(() => {
    configure({React});
    resolver = sinon.spy((element) => element);
    connect = createConnector(resolver);
    rendered = <div />;

    class MyExample extends React.Component {
      render() { return rendered; }
    }

    Example = MyExample;
  });

  describe('returned class', () => {
    it('does not override any extra instance methods', () => {
      let testMethods = [
        'componentDidMount',
        'componentWillUnmount',
        'componentDidUnmount',
        'componentWillReceiveProps',
        'setState',
      ];

      testMethods.forEach((method) => {
        Example.prototype[method] = function() { return method; };
      });

      ConnectedExample = connect({})(Example);

      let connected = new ConnectedExample();
      let example = new Example();

      testMethods.forEach((method) => {
        expect(connected[method]).to.be.defined;
        expect(connected[method]()).to.equal(example[method]());
      });
    });

    it('retains class properties', () => {
      let classProperties = {
        foo: {value: 'foo'},

        bar: {
          get() { return 'bar'; },
          set(newBar) { return newBar; },
        },

        baz: {
          value: () => {},
          enumerable: false,
          configurable: false,
        },
      };

      Object.defineProperties(Example, classProperties);
      ConnectedExample = connect(stylesheet)(Example);

      Object.keys(classProperties).forEach((prop) => {
        let descriptor = Object.getOwnPropertyDescriptor(Example, prop);
        expect(descriptor).to.deep.equal(Object.getOwnPropertyDescriptor(ConnectedExample, prop));
      });
    });

    it('copies the original class displayName', () => {
      let displayName = 'Component';
      Example.displayName = displayName;
      ConnectedExample = connect(stylesheet)(Example);
      expect(ConnectedExample.displayName).to.equal(displayName);
    });

    it('copies the original class name if displayName does not exist', () => {
      Example.displayName = '';
      ConnectedExample = connect(stylesheet)(Example);
      expect(ConnectedExample.displayName).to.equal(Example.name);
    });

    it('uses the name of a stateless component as its displayName', () => {
      function StatelessComponent() {}
      ConnectedExample = connect(stylesheet)(StatelessComponent);
      expect(ConnectedExample.displayName).to.equal(StatelessComponent.name);
    });
  });

  describe('#stylishState', () => {
    beforeEach(() => {
      ConnectedExample = connect(stylesheet)(Example);
    });

    it('returns an empty object if no stylish state is set', () => {
      expect(new ConnectedExample().stylishState).to.deep.equal({});
    });

    it('returns the stylish state', () => {
      let example = new ConnectedExample();
      let stylishState = {foo: 'bar'};
      example.state = {_StylishState: stylishState};

      expect(example.stylishState).to.deep.equal(stylishState);
    });
  });

  describe('#setStylishState', () => {
    const state = Object.freeze({foo: 'bar'});

    beforeEach(() => {
      sinon.stub(Example.prototype, 'setState');
      ConnectedExample = connect(stylesheet)(Example);
    });

    it('sets the stylish state', () => {
      new ConnectedExample().setStylishState(state);
      expect(Example.prototype.setState).to.have.been.calledWith({_StylishState: state});
    });

    it('merges in existing stylish state', () => {
      let originalState = {foo: 'qux', bar: 'baz'};
      let example = new ConnectedExample();
      example.state = {_StylishState: originalState};
      example.setStylishState(state);

      expect(Example.prototype.setState).to.have.been.calledWith({_StylishState: {...originalState, ...state}});
    });
  });

  describe('#componentWillMount', () => {
    beforeEach(() => {
      sinon.stub(Example.prototype, 'setState');
    });

    afterEach(() => {
      Example.prototype.setState.restore();
    });

    it('calls the original componentWillMount if set', () => {
      let originalWillMount = Example.prototype.componentWillMount = sinon.spy();
      ConnectedExample = connect(stylesheet)(Example);

      let subject = new ConnectedExample();
      subject.componentWillMount();
      expect(originalWillMount).to.have.been.calledOn(subject);
    });

    it('calls setState with some initial Stylish state', () => {
      let setState = Example.prototype.setState;
      ConnectedExample = connect(stylesheet)(Example);

      let subject = new ConnectedExample();
      subject.componentWillMount();
      expect(setState).to.have.been.calledOn(subject);

      let newState = setState.lastCall.args[0];
      expect(newState._StylishState).to.deep.equal({});
    });
  });

  describe('#render', () => {
    it('overrides render to call the original, then return the resolved component', () => {
      sinon.stub(Example.prototype, 'render').returns(rendered);
      let originalRender = Example.prototype.render;
      ConnectedExample = connect(stylesheet)(Example);

      let subject = new ConnectedExample();
      subject.render();
      expect(originalRender).to.have.been.calledOn(subject);
    });

    it('calls resolve on render', () => {
      sinon.stub(Example.prototype, 'render').returns(rendered);
      ConnectedExample = connect(stylesheet)(Example);

      let subject = new ConnectedExample();
      subject.render();
      expect(resolver).to.have.been.calledWith(rendered, subject, stylesheet, {});
    });

    it('passes the connection options to resolve', () => {
      let options = {foo: 'bar'};
      ConnectedExample = connect(stylesheet, options)(Example);

      new ConnectedExample().render();
      expect(resolver.lastCall.args[3]).to.equal(options);
    });

    it('returns the result of the resolve call', () => {
      ConnectedExample = connect(stylesheet)(Example);
      expect(new ConnectedExample().render()).to.equal(rendered);
    });

    describe('with stateless components', () => {
      let StatelessComponent;

      beforeEach(() => {
        StatelessComponent = sinon.stub().returns(rendered);
      });

      it('wraps a stateless component in a class', () => {
        ConnectedExample = connect(stylesheet)(StatelessComponent);
        let result = new ConnectedExample().render();

        expect(StatelessComponent).to.have.been.called;
        expect(result).to.equal(rendered);
      });

      it('passes props and context to the stateless component', () => {
        let props = {foo: true};
        let context = {bar: true};
        ConnectedExample = connect(stylesheet)(StatelessComponent);
        new ConnectedExample(props, context).render();

        expect(StatelessComponent).to.have.been.calledWith(props, context);
      });
    });

    describe('with decorate plugins', () => {
      let pluginOne;
      let pluginTwo;

      beforeEach(() => {
        pluginOne = {decorate: sinon.stub()};
        pluginTwo = {decorate: sinon.stub()};
        configure({plugins: [pluginOne, pluginTwo]});
      });

      it('calls all plugins with the correct arguments and returns the final result', () => {
        class IntermediateExample {}
        class FinalExample {}

        pluginOne.decorate.returns(IntermediateExample);
        pluginTwo.decorate.returns(FinalExample);

        ConnectedExample = connect(stylesheet)(Example);
        let decorateOptions = {stylesheet, React: config.React};

        expect(pluginOne.decorate).to.have.been.calledWith(Example, decorateOptions);
        expect(pluginTwo.decorate).to.have.been.calledWith(IntermediateExample, decorateOptions);
        expect(ConnectedExample).to.equal(FinalExample);
      });
    });
  });
});
