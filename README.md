# Symmetric

Symmetric enables a Javascript web application to securely achieve *seamless
interaction* between a client and server - without learning any frameworks,
without building any APIs, and without maintaining multiple codebases.

Symmetric allows a server and client to automatically enter and exchange
javascript execution scopes as-needed, meaning the client and server *both
operate on the same code.*

**The client** runs *whatever code it can*, then passes control over to the server.

**The server** runs *whatever code it needs to*, then passes control back to the client.

And, with server side DOM rendering enabled, Symmetric can enable your app to operate
seamlessly as both a **static website** *or* **real-time web application**, without
learning and implementing any additional framework, and without having to think
about routing/HTTP.

# Features

 * Fast development time: securely and seamlessly bridges the gap between font and back-end devs.
 * No learning curve: Absolutely no framework or API has to be learned.
 * Enhanced security: Globally encrypted values, guaranteed codepath execution.
 * Legacy support: *All* next-generation javascript features in *any browser*, forever.
 * Scalability/Redudancy: Servers can jump between code paths as needed.
 * Reliability: Advanced error handling, resolving, inspection, and resiliency.
 * Efficiency: Clients only receive the code they *need*, servers only run code when they *must.*
 * SEO/Accessibility: Seamlessly enables web apps to be navigated like static web pages.
 * Easy integration: Supports your current stack (React, Angular, Vue, Express, etc.)


# Install

`npm install symmetric`

# Usage

### Command-line interface

`symmetric app.js`

### Module

```javascript
var symmetric = require('symmetric');

symmetric('./app.js')
  .render(true)
  .port(8080);
```


# How does it work?

1. Symmetric parses the javascript the code to an abstract syntax tree (AST).
2. Symmetric uses it's own javascript evaluator to run the code on the client and server.
3. Symmetric transfers state between the client and server over websockets or AJAX fallback.

### How can it execute server code on the client?

Since Symmetric uses it's own javascript evaluator, it's able to control every
aspect of the code's operation on the client and server.

This gives Symmetric a great level of insight into your code, providing 
extensive debuggability, profiling, error handling as well as enabling the
ability to use next-generation javascript features in *any browser*,
*without browserify!*

The client knows when it can't run some code (ex: the variable isn't available on the client, but available on the server)
and gives control to the server.

### How can it execute client code on the server?

Symmetric can evaluate client code by proxying browser/client state in real time.

When the client can no longer execute some code (i.e. it needs the server to do something first),
it will tell the server to start at an *entry point* and atttempt to get to
an *exit point*, the exit point being the closest possible point at which
the server can return control to the client.

If, during the server's control period, it needs to access some variable or call
some function only available on the client, it will ask the client to do so.

Note on DOM Rendering:

With DOM-rendering enabled, the process is exactly the same, except
Symmetric starts off by executing client
code just like a browser would, inside a server-side DOM.

The server then returns any additional javascript code to the client.

The additional client-side code therefore contains all of the *entry points*,
which is just code that couldn't run on initial render (eg, event handlers).


### How can it support *all* next-generation JS in any browser?

Symmetric evaluates javascript code as a pre-parsed AST on both the server and
client.

This allows Symmetric to make the latest ECMA script features available on any client.

This also means that Symmetric can go beyond simple polyfills and do otherwise impossible things.

For example, Symmetric can fully implement the `let` keyword and the Object `Proxy` API,
providing a single consistent code execution platform on both the client and server.

*All* browsers of *any* age can use next-generation ECMA features, **if:**

1. The feature can be parsed by esprima
2. The built-in Javascript evaluator supports the feature
3. The browser can run the built-in Javascript evaluator

# Is it secure?

Much thought has been put into making Symmetric work, especially guaranteeing
that it works securely.

### Can't the client inject anything they want into my server code? (client priviledges)

Client can never inject anything (values, functions, objects, etc.) into
server scope.

The server can only ask the client for what it needs to know, and the client
has no control beyond that.

### Can't the client skip my validation/sanitization checks? (client validation)

Client can never bypass a codepath, server guarantees that all intended
operations happen, and happen in order.

Server will only enter into an entry point scope, the client cannot force
the server to jump any deeper in the code path.

Client can tell the server where it should end up based on an exit point,
and it's up to the server whether or not it ends up there.

This means that the client can modify the code in any way they want, but
they still can't bypass anything.

### Can't the client read my server code? (information disclosure)

Client can't see server values (no source code information disclosure).

Values are hashed and can only be compared to another hash on the client.

see: [How do I obscure certain code from the client](#how-do-i-obscure-certain-code-from-the-client)

# FAQ:

### How do I obscure certain code from the client?

Sometimes it's necessary to make sure that certain logic is never sent to
to the client.

In Symmetric, this is done by wrapping the code in a nested block expression `{{ ... }}`.

The benefit of using nested block expressions is that the javascript code will
run regardless of whether you're using Symmetric.

This helps to ensure that you're never locked into the Symmetric environment,
should you decide not to use it.

Another benefit is that the code will work just as well *without* nested block expressions,
and they can be added over time as-needed.

You can label blocks (useful for debugging):

```javascript
{{
  example:

  // server-only code

}}
```

```javascript
{{
  'example with spaces';

  // server-only code

}}
```


#### How do I know when to use nested block expressions?

Since Symmetric already guarantees secure validation, client input, and program control flow,
it is usually unnecessary to wrap your code in nested block expressions.

Code should only be wrapped in cases where the **embedded values** or the
**logic itself** needs to be kept secret from the client.

Some use cases for nested block expressions are:

  * Protecting special business logic
  * Protecting hardcoded database passwords
  * Protecting in-scope objects that contain sensitive information
  * Forcing code to run in the server, even though it is able to run in the client