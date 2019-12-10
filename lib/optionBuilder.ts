export class OptionBuilder {
  static build(optionList: string[]): any {
    var optionBuilder = {};
    optionList.forEach(function(option) {
      optionBuilder['set'+option.slice(0,1).toUpperCase()+option.slice(1)] = function(param) {
        this[option] = param;
        return this;
      }
      optionBuilder['get'+option.slice(0,1).toUpperCase()+option.slice(1)] = function() {
        return this[option];
      }
    });
    return optionBuilder;
  }
}