# Code Validator

Quick example of doing simple Javascript validation based on a whitelist, blacklist, and simple structural rules. Tested and working in Firefox, Chrome, IE8+. Works on mobile, not that I'd recommend it. Not production ready!

Check it out: [https://jyoko.github.io/jsvalidator](https://jyoko.github.io/jsvalidator)

Intentionally tried to minimize dependencies/complexity as much as possible, as the core part of the application is probably better-suited as a plugin/integration to existing code. That and backwards-compatibility being the only requirements, no build steps and trusty ES5 here.

AST generation is done with [Esprima](http://esprima.org). Chose Esprima for a few reasons, not least of which being I'd used it before. Additionally, Esprima is well maintained, easy-to-read, relatively lightweight, and is at the top of most benchmarks. _Most_ benchmarks being key; I've never seen Esprima do poorly, but some (Acorn and Uglify2 specifically) do better on certain codebases, so I abstracted the "parser" out.

Other external dependencies are [CodeMirror](https://codemirror.net/) for a nicer editor (not that the demo has options for switching keybindings or anything, but vim/emacs/sublime are available) and [jQuery 1.x](https://jquery.com/browser-support/) to handle IE8 (er.. cross-browser) issues.

Similarly, `ie8polyfill.js` adds `String.trim` and Array helpers `isArray`, `map`, `filter`, and `indexOf`. Code is otherwise browser friendly.

## Usage

Check out `validate.js` for example usage, the good stuff is hidden in the `validate` function:

```js
try {
  result = validator(code,rules);
} catch(e) {
  displayError(e.name + ' : ' + e.message);
}
if (result) {
  displayResult(result);
}
```

The `validator` function exposed in `validator.js` takes in `code` as a string and a validation object:

```js
var validationObject = {
  whitelist: ['array', 'of', 'tokens'],
  blacklist: ['same', 'as', 'whitelist'],
  rules: [
    ['array','or','matrix'],
    ['of', 'nested', 'order','eg:'],
    ['for','if','someFunction']
  ]
};
```

All three properties are optional and can be either a single string (for the lists) or a single array vs array-of-arrays for the nesting rules. Nesting rules are all doable with [ESTree](https://github.com/estree/estree) types, several common JS codes are mapped to the token values (like `if`,`else`,`for`,`while`).

The `validator` function will throw on errors (with itself or in the given code's Javascript syntax).

If the given code is valid Javascript and the validation runs, it will return a results object:

```js
var resultsObject = {
  passing: true || false,
  blacklist: 'item_hit_in_blacklist',
  whitelist: 'item_missing_from_whitelist',
  rules: 'the rules back'
};
```

Passing is a Boolean and always exists, the other properties will only appear singularly on a first-fail basis. The order above (blacklist, whitelist, rules) is the order code might fail.

Known issues:

* If/else nesting checks may not work as-intended
* Function declarations not available as nesting rule
* All JS words not mapped to types
