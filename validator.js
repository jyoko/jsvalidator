/*
 * validator.js
 *
 * Code validation function, takes code (as string) and validation object,
 * returns result object.
 *
 * Likely more useful as plugin to linter
 *
 * Usage:
 *
 * var result = validate(code, {
 *   blacklist: ['while','switch'],
 *   whitelist: 'for',
 *   rules: [
 *     ['for','if','else','return'],
 *     ['forEach','console.log']
 *   ]
 * });
 *
 *
 * Lists are token values as strings, either single or in an array
 * Rules are simple nesting order hash maps: key (outer token) : value (inner token)
 *
 */

var ERRORS = {
  CODE_TYPE : 'Validator - Code should be given as string',
  VALIDATE_TYPE : 'Validator - Invalid check object',
  VALIDATE_RULE : 'Validator - Invalid rule object',
};

function validator(codeStr, toValidate) {

  var result = {passing: true};
  var lists = false;
  var rules = false;
  var code;
  function isObj(v) {
    return typeof v === 'object' && !Array.isArray(v) && v !== null;
  }

  // check input is valid, missing/null/"blank" validation obj returns passing
  // weak check for actual validity beyond types, checks will generally just not work
  // if not given matchable strings (no errors, code will validate)
  if (typeof codeStr !== 'string') {
    throw new TypeError(ERRORS.CODE_TYPE);
  }
  if (isObj(toValidate)) {
    if (!toValidate.whitelist && !toValidate.blacklist && !toValidate.rules) {
      return result;
    }
    if (toValidate.hasOwnProperty('whitelist')) {
      if (!Array.isArray(toValidate.whitelist)) {
        toValidate.whitelist = [toValidate.whitelist];
      }
      lists = true;
    } else {
      toValidate.whitelist = []
    }
    if (toValidate.hasOwnProperty('blacklist')) {
      if (!Array.isArray(toValidate.blacklist)) {
        toValidate.blacklist = [toValidate.blacklist];
      }
      lists = true;
    } else {
      toValidate.blacklist = []
    }
    if (toValidate.hasOwnProperty('rules')) {
      if (!Array.isArray(toValidate.rules)) {
        throw new TypeError(ERRORS.VALIDATE_RULE);
      }
      if (!Array.isArray(toValidate.rules[0])) {
        toValidate.rules = [toValidate.rules];
      }
      rules = true;
    }
  } else {
    if (toValidate === void 0) {
      return result;
    }
    throw new TypeError(ERRORS.VALIDATE_TYPE);
  }

  // If no rules given, can do list-check with only tokens
  if (rules) {
    code = lists? parser.parse(codeStr,{tokens:true}) : parser.parse(codeStr);
  } else {
    code = parser.tokenize(codeStr); 
  }

  // Run validations as-needed
  // TODO: ? include location ?
  if (lists) {
    result = checkLists(code, toValidate, result);
  }
  if (result.passing && rules) {
    result = checkRules(code, toValidate, result);
  }

  return result;

  function checkLists(code, toValidate, result) {
    result = result || {passing:true};
    code = code.tokens? code.tokens : code;
    var whitelist = toValidate.whitelist.slice();
    var blacklist = toValidate.blacklist;
    var bl = !!blacklist.length,wl = !!whitelist.length;
    var blackChk = -1,whiteChk = -1;
    var val;
    var methodStr = false;
    var i = code.length;
    while (i--) {
      val = code[i].value;

      // build methods into string for list convenience
      if (val === '.') {
        methodStr = (methodStr?methodStr:code[i-1].value)+'.'+code[i+1].value;
        i--;
      } else {
        methodStr = false;
      }

      // naive check, should be fine if lists aren't huge
      if (methodStr) {
        if (wl) {
          whiteChk = whitelist.indexOf(methodStr);
          if (whiteChk !== -1) {
            whitelist.splice(whiteChk,1);
          }
        }
        if (bl) blackChk = blacklist.indexOf(methodStr);
      } else {
        if (wl) {
          whiteChk = whitelist.indexOf(val);
          if (whiteChk !== -1) {
            whitelist.splice(whiteChk,1);
          }
        }
        if (bl) blackChk = blacklist.indexOf(val);
      }

      // exit loop if blacklist hit or (whitelist OK and no blacklist)
      wl = !!whitelist.length;
      if (blackChk!==-1 || (!wl && !bl)) break;
    }

    // add failing notifications to result obj
    // blacklist takes precedence over whitelist, as we stop searching on hit
    if (blackChk!==-1) {
      result.passing = false;
      result.blacklist = methodStr || val;
    } else {
      if (whitelist.length) {
        result.passing = false;
        result.whitelist = whitelist;
      }
    }

    return result;
  }

  function checkRules(code, toValidate, result) {

    result = result || {passing:true};
    var AST = code.body;
    var rules = toValidate.rules.slice();

    // added token (ie: human) names to AST keys
    // only a few values substituted, full list for easy updating
    var types = {
        AssignmentExpression: 'AssignmentExpression',
        AssignmentPattern: 'AssignmentPattern',
        ArrayExpression: 'ArrayExpression',
        ArrayPattern: 'ArrayPattern',
        ArrowFunctionExpression: 'ArrowFunctionExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        'break': 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        'catch': 'CatchClause',
        ClassBody: 'ClassBody',
        ClassDeclaration: 'ClassDeclaration',
        'class': 'ClassDeclaration',
        ClassExpression: 'ClassExpression',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        'continue': 'ContinueStatement',
        DoWhileStatement: 'DoWhileStatement',
        'dowhile': 'DoWhileStatement',
        DebuggerStatement: 'DebuggerStatement',
        EmptyStatement: 'EmptyStatement',
        ExportAllDeclaration: 'ExportAllDeclaration',
        ExportDefaultDeclaration: 'ExportDefaultDeclaration',
        ExportNamedDeclaration: 'ExportNamedDeclaration',
        ExportSpecifier: 'ExportSpecifier',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        'for': 'ForStatement',
        ForOfStatement: 'ForOfStatement',
        'forOf': 'ForOfStatement',
        ForInStatement: 'ForInStatement',
        'forIn': 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        'if': 'IfStatement',
        'else': 'IfStatement',
        ImportDeclaration: 'ImportDeclaration',
        ImportDefaultSpecifier: 'ImportDefaultSpecifier',
        ImportNamespaceSpecifier: 'ImportNamespaceSpecifier',
        ImportSpecifier: 'ImportSpecifier',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        MetaProperty: 'MetaProperty',
        MethodDefinition: 'MethodDefinition',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        ObjectPattern: 'ObjectPattern',
        Program: 'Program',
        Property: 'Property',
        RestElement: 'RestElement',
        ReturnStatement: 'ReturnStatement',
        'return': 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SpreadElement: 'SpreadElement',
        Super: 'Super',
        SwitchCase: 'SwitchCase',
        'case': 'SwitchCase',
        SwitchStatement: 'SwitchStatement',
        'switch': 'SwitchStatement',
        TaggedTemplateExpression: 'TaggedTemplateExpression',
        TemplateElement: 'TemplateElement',
        TemplateLiteral: 'TemplateLiteral',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        'throw': 'ThrowStatement',
        TryStatement: 'TryStatement',
        'try': 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        'var': 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        'while': 'WhileStatement',
        WithStatement: 'WithStatement',
        'with': 'WithStatement',
        YieldExpression: 'YieldExpression'
    };

    // TODO: Function declarations?
    //       Fix nested IF/ELSE issues
    //       Return more useful information on fail
    function searchBody (body, rules, check) {
      var node,rule,isElse;
      // if drop IE8: check = new Array(rules.length).fill(0);
      if (!check) {
        var l = rules.length;
        check = new Array(l);
        while (l--) {
          check[l] = 0;
        }
      }

      for (var j=0,bl=body.length; j<bl; j++) {
        node = body[j];
        for (var i=0; i<rules.length; i++) {
          isElse = false;
          rule = types[rules[i][check[i]]] || types['ExpressionStatement'];
          if (rules[i][check[i]] === 'else') {
            isElse = true;
          }
          if (rule === node.type) {
            if (isElse && node.alternate) {
              check[i]++;
            } else if (rule !== types['ExpressionStatement'] || 
                       rules[i][check[i]] === parseExpression(node.expression)) {
              check[i]++;
            }    
            if (check[i]===rules[i].length) {
              rules.splice(i,1);
              check.splice(i,1);
              i--;
              if (rules.length===0) {
                return true;
              }
            }
          }
        }

        // outside inner (rules) loop, recurse if we want to check
        if (node.type === types['IfStatement']) {
          if (node.consequent) {
            searchBody(node.consequent.body || [node.consequent], rules, check);
          }
          if (node.alternate) {
            searchBody(node.alternate.body || [node.alternate], rules, check);
          }
        }
        if (node.body) {
          searchBody(node.body.body, rules, check);
        }
          
      }
      return !rules.length;

      // CallExpressions specifically, ignoring others
      function parseExpression(expression) {
        if (expression.type !== types['CallExpression']) return '';
        var name, callee = expression.callee;
        if (callee.type === types['MemberExpression']) {
          name = callee.object.name + '.' + callee.property.name;
        } else if (callee.type === types['Identifier']) {
          name = callee.name;
        }
        return name;
      }
    }

    result.passing = result.passing && searchBody(code.body, toValidate.rules);
    if (!result.passing) {
      result.rules = rules;
    }
    return result;
  }

}
