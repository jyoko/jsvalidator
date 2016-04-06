/*
 * parser.js
 *
 * Wrapper for validator, easy to drop in replacements
 *
 * Needs to have parse & tokenize methods, optional arguments to include tokens w/ parse
 * should return ESTree AST, tokens as {type:TYPE,value:VALUE}
 * tokens as "tokens" property array if requested
 *
 */

var parser = {
  parse: function(c,o) {
    o = o || {};
    var opts = {};
    if (o.tokens) {
      opts.tokens = true;
    }
    return esprima.parse(c,opts);
  },
  tokenize: esprima.tokenize
};
