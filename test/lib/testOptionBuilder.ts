import { OptionBuilder } from "../../lib/optionBuilder";

describe('Option Builder Tests', function() {
    it('should set and get a value', function() {
        var ob = OptionBuilder.build(['animal', 'plant']);
        ob.setAnimal('turtle');
        ob.setPlant('tree');
        ob.getAnimal().should.be.equal('turtle');
        ob.getPlant().should.be.equal('tree');
        ob.animal.should.be.equal('turtle');
        ob.plant.should.be.equal('tree');
    })
});