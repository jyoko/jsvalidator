/*
 * validate.js
 *
 * Runs validator in demo.html
 *
 */

var parseId,cm;
validate(100);
cm = CodeMirror.fromTextArea(document.getElementById('code'), {
  lineNumbers: true,
  mode: 'javascript',
  tabSize: 2,
  matchBrackets: true
});
cm.on('change', runVal);
$('#whitelist').on('keyup', runVal);
$('#blacklist').on('keyup', runVal);
$('#rules').on('keyup', runVal);

function runVal() {
  validate();
}
function validate(delay) {
  var result,code,rules = {};
  var wl = document.getElementById('whitelist').value;
  var bl = document.getElementById('blacklist').value;
  var rl = document.getElementById('rules').value;
  if (parseId) {
    window.clearTimeout(parseId);
  }
  parseId = window.setTimeout(function() {
    code = cm.getValue();
    if (wl!=='') {
      rules.whitelist = wl.split(',').map(function(x) {
        return x.trim()
      });
    }
    if (bl!=='') {
      rules.blacklist = bl.split(',').map(function(x) {
        return x.trim();
      });
    }
    if (rl!=='') {
      rules.rules = rl.split('\n').map(function(x) {
        return x.split(',').map(function(x) {
          return x.trim();
        });
      }).filter(function(x) {
        return x.length>1;
      });
    }

    try {
      result = validator(code,rules);
    } catch(e) {
      displayError(e.name + ' : ' + e.message);
    }
    if (result) {
      displayResult(result);
    }
    parseId = undefined;
  }, delay || 400);
}

function displayError(msg) {
  var $notify = $('#notification');
  $notify.removeClass().addClass('error').text(msg).show();
}

function displayResult(result) {
  var msg;
  var $notify = $('#notification');
  if (result.whitelist) {
    msg = 'Code is missing : '+result.whitelist.join(', ');
  }
  if (result.blacklist) {
    msg = 'Code not allowed : '+result.blacklist;
  }
  if (result.rules) {
    msg = 'Rules failing : '
    for (var i=0; i<result.rules.length; i++) {
      msg+=result.rules[i].shift();
      msg+=' must contain ';
      msg+=result.rules[i].join(' containing ')
      msg+=(i+1)===result.rules.length?'':'; ';
    }
  }
  $notify.removeClass().addClass(result.passing?'pass':'fail').text(msg || 'Passing').show();
}
