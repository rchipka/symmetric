'use strict';

var assert = require('assert'),
    symmetric = require('../index.js'),
    esprima    = require('esprima');

function parseJS(fn) {
  return esprima.parseScript('(' + fn.toString() + ')();');
}


describe('Evaluate', function () {

});

describe('State transfer', function () {
  var client1Globals = {
    console,
    setInterval,
    opaqueCall: function (cb) {
      // cb();
      setInterval(cb, 1000);
    }
  };

  var client2Globals = {
    logNumber: 0,
    logMessage: function () {
      return 'test ' + (++client2Globals.logNumber);
    }
  };

  var app = parseJS(function () {
    opaqueCall(function () {
      console.log(logMessage());
    });
  });

  var client1 = new symmetric(app, function (state) {
    if (!client2.isRunning) {
      client2.run(client2Globals);
    }

    client2.sync(state);
  });

  var client2 = new symmetric(app, function (state) {
    client1.sync(state);
    
  });

  it('should transfer', function (done) {
    client1.run(client1Globals, function () {
      done();
    });
  });
});
