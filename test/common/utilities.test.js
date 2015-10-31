import '../helper';
import * as utils from '../../src/common/utilities';

describe('utilities', () => {
  it('exports lodash.isFunction', () => {
    expect(utils.isFunction).to.be.a('function');
  });

  it('exports lodash.isArray', () => {
    expect(utils.isArray).to.be.a('function');
  });

  it('exports lodash.isObject', () => {
    expect(utils.isObject).to.be.a('function');
  });

  it('exports lodash.isNumber', () => {
    expect(utils.isNumber).to.be.a('function');
  });

  it('exports lodash.isEmpty', () => {
    expect(utils.isEmpty).to.be.a('function');
  });

  it('exports lodash.merge', () => {
    expect(utils.merge).to.be.a('function');
  });

  it('exports lodash.flatten', () => {
    expect(utils.flatten).to.be.a('function');
  });

  describe('isObject', () => {
    let {isObject} = utils;

    it('returns true for objects', () => {
      expect(isObject({foo: 'bar'})).to.be.true;
    });

    it('returns false for null', () => {
      expect(isObject(null)).to.be.false;
    });

    it('returns false for object-like structures', () => {
      expect(isObject(() => {})).to.be.false;
      expect(isObject(['foo', 'bar'])).to.be.false;
    });
  });

  describe('asArray', () => {
    let {asArray} = utils;

    it('returns the object if it is an array', () => {
      let array = ['foo', 'bar'];
      expect(asArray(array)).to.equal(array);
    });

    it('returns the object if it is an array', () => {
      expect(asArray('foo')).to.deep.equal(['foo']);
    });
  });

  describe('hoistStatics', () => {
    let {hoistStatics} = utils;

    it('copies property descriptors', () => {
      let foo = Object.create({}, {
        foo: {
          value: 'foo',
          writable: false,
        },

        bar: {
          get() { return 'bar'; },
          enumerable: false,
        },

        baz: {
          set(newBaz) { return newBaz; },
          configurable: false,
        },
      });

      let bar = {};

      hoistStatics({from: foo, to: bar});

      ['foo', 'bar', 'baz'].forEach((prop) => {
        let fooProp = Object.getOwnPropertyDescriptor(foo, prop);
        let barProp = Object.getOwnPropertyDescriptor(bar, prop);
        expect(fooProp).to.deep.equal(barProp);
      });
    });

    it('does not copy reserved properties', () => {
      let foo = {
        arguments: 'foo',
        caller: 'bar',
        callee: 'baz',
        length: 'foo',
        name: 'bar',
        prototype: 'baz',
        type: 'foo',
      };

      let bar = {};
      hoistStatics({from: foo, to: bar});
      expect(Object.keys(bar)).to.be.empty;
    });
  });

  describe('kebabToCamel', () => {
    let {kebabToCamel} = utils;

    it('converts kebab case to camel case', () => {
      expect(kebabToCamel('foo-bar-baz')).to.deep.equal('fooBarBaz');
    });
  });
});
