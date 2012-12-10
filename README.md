Probes.js
=========

Runtime performance instrumentation for JavaScript.


Build Status
------------

<table>
  <tr><td>Master</td><td><a href="http://travis-ci.org/s2js/probes" target="_blank"><img src="https://secure.travis-ci.org/s2js/probes.png?branch=master" /></a></tr>
  <tr><td>Development</td><td><a href="http://travis-ci.org/s2js/probes" target="_blank"><img src="https://secure.travis-ci.org/s2js/probes.png?branch=dev" /></a></tr>
</table>


Overview
--------

Probes.js provides userland instrumentation for JavaScript. Because it operates in userland, probes is able collect statistics about runtime behavior of an application no matter where it executes. Stats can be collected server side, or client side within a browser. Other performance monitoring technologies require hooks into the JavaScript virtual machine which are not portable, or accessible to remotely executing code; nor should they for security purposes.

There are three discrete types of probes available: response time gauge, trace and capturing. Each type of probe offers different collection capabilities and output statistics.

The default probe type is the response time gauge. The gauge uses AOP to advise function executions, measuring their response time.  Basic statistics are generated from each execution including: invocation count, the kind of response (returned, thrown, and for promises resolved or rejected), min, max and mean response times, and the standard deviation around the mean.

```javascript
var controller, responseTimeGauge;

responseTimeGauge = require('probes/types/responseTimeGauge');
controller = ...;

responseTimeGauge(controller, 'interestingOperation', 'app/controller/interestingOperation');
```

From now on, when `controller.interestingOperation()` is invoked, the execution is captured by the probe, and the statics are made available on the manifold under 'app/controller/interestingOperation'.

The capturing probe is the simplest probe. All it does is capture an object's values and publish them to the manifold.

```javascript
var capturing, clone;

capturing = require('probes/types/capturing');
clone = require('probes/util/clone');

if (window.performance && window.performance.memory) {
    capturing(clone, window.performance, 'memory', 5000, 'performance/memory');
}
```

In this example, we're capturing the value of `window.performance.memory` every five seconds, cloning it's content before publishing the value to the manifold as 'performance/memory'. `window.performance.memory` contains memory utilization stats including the heap size and usage. This particular example is useful enough, it's provided as `probes/instrument/pageMemory`. Note: `window.performance.memory` is currently only supported in Chrome.

In these examples, we've seen that probes can generate statistics and public them to a manifold. The manifold is a central location to read the current values generated by a probe. Either the value of a specific probe can be interrogated, or the most recent values from every probe can be retrieved.

```javascript
var manifold = require('probes/manifold');

console.log(manifold('app/controller/interestingOperation'));
/*
 * {
 *    all: { count: 496, mean: 113.5786290322582, stddev: 436.6374566530684, min: 15, max: 8108 },
 *    returned: { count: 449, mean: 119.09576837416476, stddev: 457.73798182407245, min: 31, max: 8108 },
 *    thrown: { count: 47, mean: 60.87234042553193, stddev: 88.69381063187741, min: 15, max: 412 },
 *    resolved: { count: 0, mean: NaN, stddev: NaN, max: NaN, min: NaN },
 *    rejected: { count: 0, mean: NaN, stddev: NaN, max: NaN, min: NaN }
 * }
 */

console.log(manifold('performance/memory'));
// { jsHeapSizeLimit: 793000000, usedJSHeapSize: 10000000, totalJSHeapSize: 18200000 }
```

Reading values from the manifold is much simpler then tracking every probe created and reading values directly from each probe.

The trace probe extends the concepts of the response time gauge, however, instead of capturing gauge statistics, a trace of the execution is captured. Each installed trace probe collaborates to create a single trace per event. Fair warning, the trace probe attempts to collect as much information about the execution as it can, due to the nature of JavaScript however, sometimes this info is maddeningly vague.

```javascript
var trace, math, probeMultiply, probeToNumber;

trace = require('probes/types/trace');

math = {
	multiply: function (a, b) {
		return this.toNumber(a) * this.toNumber(b);
	},
	toNumber: function (num) {
		return parseFloat(num);
	},
	...
};

probeMultiply = trace(math, 'multiply');
probeToNumber = trace(math, 'toNumber');

math.multiply('2', '3.14e5');

probeMultiply().then(console.log.bind(console));
/*
 * {
 *   id: 14,
 *   root: {
 *     id: 1,
 *     range: { micros: 573, millis: 1, seconds: 0, start: 1355170087495, end: 1355170087496 },
 *     operation: {
 *       method: { type: 'string', value: 'multiply'},
 *       context: { type: 'object', value: '[object Object]', proto: 'Object'},
 *       args: [
 *         { type: 'string', value: '2'},
 *         { type: 'string', value: '3.14e5'}
 *       ],
 *       label: '5EB7D28E-32BD-4050-BB42-07A9FB08F3B3',
 *       return: { type: 'number', value: '628000' }
 *     },
 *     children: [
 *       {
 *         id: 2,
 *         range: { micros: 111, millis: 0, seconds: 0, start: 1355170087495, end: 1355170087495 },
 *         operation: {
 *           method: { type: 'string', value: 'toNumber'},
 *           context: { type: 'object', value: '[object Object]', proto: 'Object' },
 *           args: [
 *             { type: 'string', value: '2' }
 *           ],
 *           label: 'C738C048-DC91-430E-ADE1-C9D33A6DD290',
 *           return: { type: 'number', value: '2'}
 *         },
 *         children: []
 *       },
 *       {
 *         id: 3,
 *         range: { micros: 38, millis: 0, seconds: 0, start: 1355170087496, end: 1355170087496 },
 *         operation: {
 *           method: { type: 'string', value: 'toNumber' },
 *           context: { type: 'object', value: '[object Object]', proto: 'Object' },
 *           args: [
 *             { type: 'string', value: '3.14e5' }
 *           ],
 *           label: 'C738C048-DC91-430E-ADE1-C9D33A6DD290',
 *           return: { type: 'number', value: '314000'}
 *         },
 *         children: []
 *       }
 *     ]
 *   }
 * }
 */
```

At first blush, the value logged to the console is a large blob of JSON, but when you look a bit deeper three distinct frames emerge. Within the root, there is an frame that in turn has two children, each with zero children. The hierarchy of the children directly matches how we'd expect the code to execute, where multiply calls toNumber for each argument. Also within each frame, we can clearly see the time range the frame represents, and an operation that includes details about the method being invoked, the 'this' context, arguments and the return value. The structure of this trace follows that of [Spring Insight](http://www.springsource.org/insight/).


Supported Environments
----------------------

Our goal is to work in every major JavaScript environment; Node.js and major browsers are actively tested and supported.

If your preferred environment is not supported, please let us know. Some features may not be available in all environments.

Tested environments:
- Node.js (0.6, 0.8)
- Chrome (stable)
- Firefox (stable, LTS, should work in earlier versions)
- IE (6-10)
- Safari (6+, should work in earlier versions)
- Opera (12+, should work in earlier versions)


Getting Started
---------------

Probes.js can be installed via `npm`, or from source.

To install without source:

    $ npm install probes

From source:

    $ npm install

Probes.js is designed to run in a browser environment, utilizing [AMD modules](https://github.com/amdjs/amdjs-api/wiki/AMD), or within [Node.js](http://nodejs.org/).  [curl](https://github.com/cujojs/curl) is highly recommended as an AMD loader, although any loader should work.

An ECMAScript 5 compatible environment is assumed.  Older browsers, ::cough:: IE, that do not support ES5 natively can be shimmed.  Any shim should work, although we've tested against cujo's [poly](https://github.com/cujojs/poly)


Reporting Issues
----------------

Please report issues on [GitHub](https://github.com/s2js/probes/issues).  Include a brief description of the error, information about the runtime (including shims) and any error messages.

Feature requests are also welcome.


Running the Tests
-----------------

The test suite can be run in two different modes: in node, or in a browser.  We use [Buster.JS](http://busterjs.org/) as the test driver, buster is installed automatically with other dependencies.

Before running the test suite for the first time:

    $ npm install

To run the suite in node:

    $ npm test

To run the suite in a browser:

    $ npm start
    browse to http://localhost:8282/ in the browser(s) you wish to test.  It can take a few seconds to start.


Contributors
------------

- Scott Andrews <andrewss@vmware.com>
- Brian Cavalier <bcavalier@vmware.com>

Please see CONTRIBUTING.md for details on how to contribute to this project.


Copyright
---------

Integration is made available under the MIT license.  See LICENSE.txt for details.

Copyright (c) 2012 VMware, Inc. All Rights Reserved.

VMware, Inc.
3401 Hillview Avenue
Palo Alto, CA 94304


Change Log
----------

.next
- everything is new