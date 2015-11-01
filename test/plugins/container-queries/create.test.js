import '../../helper';

import createContainerQuery, {parseContainerQuery} from '../../../src/plugins/container-queries/create';

describe('Plugins', () => {
  describe('ContainerQueries', () => {
    const min = 400;
    const max = 600;

    describe('createContainerQuery', () => {
      it('accepts a min width', () => {
        expect(createContainerQuery({min})).to.deep.equal(`containerQuery(${min},)`);
      });

      it('accepts a max width', () => {
        expect(createContainerQuery({max})).to.deep.equal(`containerQuery(,${max})`);
      });

      it('accepts a min and max width', () => {
        expect(createContainerQuery({min, max})).to.deep.equal(`containerQuery(${min},${max})`);
      });

      it('accepts a minimum width as a number', () => {
        expect(createContainerQuery(min)).to.deep.equal(`containerQuery(${min},)`);
      });

      it('accepts a maximum width as a number', () => {
        expect(createContainerQuery(null, max)).to.deep.equal(`containerQuery(,${max})`);
      });

      it('accepts a minimum and maximum width as a number', () => {
        expect(createContainerQuery(min, max)).to.deep.equal(`containerQuery(${min},${max})`);
      });

      it('returns an actual object if a rule is supplied', () => {
        let rule = {backgroundColor: 'red'};
        let result = createContainerQuery({min, max}, rule);

        expect(result).to.deep.equal({[`containerQuery(${min},${max})`]: rule});
      });

      it('returns an actual object if a rule is supplied with explicit min and max', () => {
        let rule = {backgroundColor: 'red'};
        let result = createContainerQuery(min, max, rule);

        expect(result).to.deep.equal({[`containerQuery(${min},${max})`]: rule});
      });
    });

    describe('parseContainerQuery', () => {
      it('extracts queries with only a min width', () => {
        expect(parseContainerQuery(createContainerQuery({min}))).to.deep.equal({min, max: Infinity});
      });

      it('extracts queries with only a max width', () => {
        expect(parseContainerQuery(createContainerQuery({max}))).to.deep.equal({min: 0, max});
      });

      it('extracts queries with a min and max width', () => {
        expect(parseContainerQuery(createContainerQuery({min, max}))).to.deep.equal({min, max});
      });
    });
  });
});
