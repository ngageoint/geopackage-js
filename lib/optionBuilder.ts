export class OptionBuilder {
  static build(optionList: string[]): any {
    const optionBuilder = {} as any;
    optionList.forEach(function(option) {
      optionBuilder['set' + option.slice(0, 1).toUpperCase() + option.slice(1)] = function(param: any): OptionBuilder {
        this[option] = param;
        return this;
      };
      optionBuilder['get' + option.slice(0, 1).toUpperCase() + option.slice(1)] = function(): any {
        return this[option];
      };
    });
    return optionBuilder;
  }
}
