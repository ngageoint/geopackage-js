import 'mocha';
import { should, expect } from 'chai'

describe('TypeScript Tests', function() {
  it('should run', function() {
    console.log('Typescrpt tests running');
  })

  describe('Array', function() {
    describe('#indexOf()', function() {
      it('should return -1 when the value is not present', function() {
        [1,2,3].indexOf(5).should.be.equal(-1);
        [1,2,3].indexOf(0).should.be.equal(-1);
      });
      it('should return -1 when the value is not present using expect', function() {
        expect([1,2,3].indexOf(5)).to.equal(-1);
        expect([1,2,3].indexOf(0)).to.equal(-1);
      });
    });
  });
});