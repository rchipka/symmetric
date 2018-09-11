'use strict';

var esEval = require('esprima-eval');

function _hasOwnProperty(object, property) {
  if (!object) {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(object, property);
}

function State(key, parent) {
  this.hasParent = (typeof parent !== 'undefined');
  this.index = 0;
  this.hasChildren = false;
  this.offset = 0;
  this.children = {};

  this.path = key;

  if (this.hasParent === true) {
    this.parent = parent;
    this.parent.hasChildren = true;

    if (!_hasOwnProperty(this.parent.children, key)) {
     this.parent.children[key] = 0;
    }

    this.index = this.parent.offset + (this.parent.children[key]++);

    this.path = this.parent.path + this.path;
  }

  this.path += this.index.toString();

  return this;
}

State.prototype.getPath = function (target) {
  var object;

  if (!_hasOwnProperty(target, this.path)) {
    object = target[this.path] = {
      index: 0,
    };
  } else {
    object = target[this.path];
  }

  return object;
}

State.prototype.increment = function (target) {
  var object = this.getPath(target);

}

State.prototype.getObject = function (target, increment) {
  var object = this.getPath(target);

  if (increment === true && _hasOwnProperty(object, object.index)) {
    object.index++;
  }

  if (!_hasOwnProperty(object, object.index)) {
    return object[object.index] = {};
  }

  return object[object.index];
}

State.prototype.get = function (target, defaultValue) {
  var object = this.getObject(target);

  if (!_hasOwnProperty(object, 'value')) {
    return defaultValue;
  }

  return object.value;
}

State.prototype.set = function (target, value) {
  var object = this.getObject(target, true);

  console.log('set', this.path,
    // target,
    value);

  object.type = typeof value;
  
  if (value instanceof esEval.InternalProxy) {
    object.proxy = true;
  } else if (object.type === 'function') {
    object.calls = 0;
    value.__path__ = this.path;
    value.__state__ = this;
  } else if (Object(value) !== value) {
    object.value = value;
  }

  return object;
}

State.log = function (state) {
  var unlogged_keys = [];

  for (var key in state) {
    var val = state[key];

    if (!val.index) {
      if (!val || typeof val !== 'object') {
        unlogged_keys.push(key);
        continue;
      }
    }

    // if (val.logged && !val.index) {
    //   unlogged_keys.push(key);
    //   continue;
    // }

    if (val.type === 'undefined') {
      unlogged_keys.push(key);
      continue;
    }

    if (val.type === 'object') {
      console.log('\t', key, '[object]');
    } else {
      console.log('\t', key, val);
    }
    
    // val.logged = true;
  }

  // console.log(unlogged_keys.join(' '));
}

module.exports = State;