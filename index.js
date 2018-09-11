'use strict';

var esEval = require('esprima-eval'),
    State = require('./lib/State.js'),
    NodeTypes = require('./lib/NodeTypes');

function awaitState() {};
function awaitFunc () {
  return awaitState;
};

function _hasOwnProperty(object, property) {
  if (!object) {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(object, property);
}

function Symmetric(code, sync) {
  var self = this;

  this.code = code;
  this.stack = {
    count: 0,
    syncing: false,
    push: function () {
      this.count++;
      // console.log('stack++', this.count);
    },
    pop: function () {
      var self = this;

      setTimeout(function () {
        if (--self.count === 0) {
          self.done();
        }
        // console.log('stack--', self.count);
      });
    },
    done: function () {

      setTimeout(function () {
        if (self.syncing === true) {
          return;
        }

      //   console.log('SYNC');
      //   console.log('LOCAL');
      // console.log(self.local);

        console.log('\nLOCAL');

        State.log(self.local);

        console.log('\nREMOTE');
        State.log(self.remote);

        self.syncing = true;

        console.log('\n');

        var state = {},
            local = self.local,
            remote = self.remote,
            value;

        sync(local, self.sync);
      });
    }
  };

  this.state = new State();
  this.local = {};
  this.remote = {};
  this.syncing = false;
  this.proxy = new esEval.InternalProxy(this, {
    get: function (scope, node, target, property, callback) {
      console.log('PROXY get', property, scope.state.path);
      return callback(scope.state.get(self.remote, self.proxy), target, property);
    },
    apply: function (scope, node, target, context, args, callback) {
      // console.log('PROXY apply', target, context, args);

      if (!(target instanceof esEval.InternalProxy)) {
        return callback(target.call(context, args));
      }

      var state;

      for (var i = 0; i < args.length; i++) {
        console.log('check arg' ,args[i].__state__);
        if (typeof args[i] === 'function' &&
            (state = args[i].__state__) !== undefined) {
          console.log('CHECK FUNC ARG');
          var remote = state.getObject(self.remote),
              local  = state.getObject(self.local);

            console.log(remote);
            console.log(local);

          if (local.calls < remote.calls) {

            for (var j = local.calls; j < remote.calls; j++) {
              console.log('EXEC REMOTE CALL, offset: ', local.index, scope.state);

              scope.call(node, args[i], undefined, [], function (v) {
                console.log('done call', v);
                return v;
              });
            }
          }
        }
      }

      var value = scope.state.get(self.remote);

      if (value instanceof esEval.InternalProxy) {
        value = 'InternalProxy';
      }

      console.log('callback', scope.state.path, value);

      return callback(scope.state.get(self.remote, this.proxy));
    }
  });

  return this;
}

Symmetric.prototype.await = function (state, callback) {
  var object = state.getObject(this.remote);

  if (typeof object.type === 'string' && object.type !== 'await') {
    console.log('await', object);
    return callback(object.value);
  }

  object.type = 'await';
  object.value = callback;
};

Symmetric.prototype.merge = function (source, target) {
  if (target === undefined) {
    return this.merge(source, this.remote);
  }

  var proxy = this.proxy, path, object, value,
      targetIsLocal = (target === this.local);

  for (path in source) {
    var state = source[path];

    if (!_hasOwnProperty(target, path)) {
      target[path] = {
        index: state.index,
      };
    }

    for (var index in state) {
      if (index === 'index') continue;

      object = state[index];
      value = object.value;

      if (targetIsLocal === false) {
        if (object.type === 'function') {
          object.value = proxy;
        }

        if (object.type === 'object' && object.value !== null) {
          object.value = proxy;
        }

        if (target[path][index] && target[path][index].value instanceof Function) {
          (function (func, value) {
            setTimeout(function () {
              func(value);
            });
          })(target[path][index].value, object.value);
        }
      }

      // console.log('merge', path, index, object, target[path]);

      target[path][index] = object;
    }
  }
};

Symmetric.prototype.run = function (globals, callback) {
  var symmetric = this;

  var script = new esEval.Scope(globals);

  script.on('walk', function (node, callback) {
    var state = node.stateObj;

    if (!(state instanceof State)) {
      state = node.stateObj = new State(NodeTypes.translate(node.type), this.state);
    }

    symmetric.stack.push();

    // Symmetric must create a child scope for every AST node walked
    return this.child(null, function (scope) {
      scope.state = state;

      return scope._walk(node, function (value, object, prop) {
        symmetric.stack.pop();

        if (value !== awaitState) {
          if (NodeTypes.shouldStore[node.type] !== false) {
            state.set(symmetric.local, value);

            scope.state.increment(symmetric.local);
          }

          return callback(value, object, prop);
        }

        // symmetric.stack.pop();

        // console.log('await', path, symmetric.remote);
        symmetric.await(state, function (value, type) {
          if (value instanceof esEval.InternalProxy) {
            console.log('await got InternalProxy');
          } else {
            console.log('await got', value);
          }

          if (value === null) {
            return callback(value);
          }

          if (typeof value === 'object' && !(value instanceof esEval.InternalProxy)) {
            if (value.type === 'function') {
              return callback(awaitFunc);
            }

            console.log('not calling callback');

            return;
          }

          return callback(value);
        });

        symmetric.stack.done();
      });
    });
  });

  script.on('get', function (key, resolve) {
    console.log('get', key, this.state.path);
    return this._get(key, resolve, function () {
      console.log('new awaitState', key);
      resolve(awaitState);
    });
  });

  script.on('childFunction', function (context, args, callback) {
    var local = this.state.getObject(symmetric.local);

    console.log('enter function', this.state.path, local);

    if (!_hasOwnProperty(local, 'calls')) {
      local.calls = 0;
    }

    local.calls++;

    return this._childFunction(context, args, function (v, o, p) {
      console.log('exit function');
      return callback(v, o, p);
    });
  });

  script.on('call', function (node, callee, context, args, resolve, reject) {
    var state = this.state,
        path = state.path,
        local = state.getObject(symmetric.local),
        remote = state.getObject(symmetric.remote);
    
    console.log('function call', path);

    if (!_hasOwnProperty(local, 'calls')) {
      local.calls = 0;
    }

    local.calls++;

    return this._call(node, callee, context, args, function (v, o, p) {
      console.log('function done', path);
      return resolve(v, o, p);
    }, reject);
  });

  return script.walk(this.code, function (retVal) {
    setTimeout(function () {
      if (typeof callback === 'function') {
        callback(retVal);
      }
      // symmetric.stack.pop();
    });
    // console.log('DONE', retVal);
  });
};

Symmetric.prototype.sync = function (state) {
  console.log('SYNC');
  console.log(state);
  this.merge(state);

  this.syncing = false;
};

module.exports = Symmetric;
module.exports.State = State;
module.exports.esEval = esEval;
module.exports.NodeTypes = NodeTypes;