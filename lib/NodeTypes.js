'use strict';

var NodeTypes = module.exports = {
  CallExpression: 'CE',
  FunctionExpression: 'FE',
  MemberExpression: 'ME',
  FunctionDeclaration: 'FD',
  ExpressionStatement: 'ES',
  BlockStatement: 'BS',
  Program: 'P',
  Identifier: 'I',
  Literal: 'L',
  VariableDeclaration: 'VD',
  BinaryExpression: 'BE',
  UnaryExpression: 'UE',
  IfStatement: 'IF',
  TemplateLiteral: 'TL',
  ForStatement: 'FOR',
  translate: function TranslateNodeType(type) {
    var t = NodeTypes[type];

    if (t === undefined) {
      return type;
    }

    return t;
  },
  shouldStore: {
    // Identifier: false,
    // Literal: false,
  }
};
