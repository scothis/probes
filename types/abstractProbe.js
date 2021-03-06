/*
 * Copyright (c) 2012 VMware, Inc. All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

(function (define) {
	"use strict";

	var undef;

	/**
	 * Foundation support for probes
	 *
	 * @author Scott Andrews
	 */
	define(function (require) {

		var manifold, when;

		manifold = require('../manifold');
		when = require('when');

		return function (probeImpl, name) {
			var advised;

			/**
			 * @returns current value for the probe
			 */
			function probe() {
				return get();
			}

			/**
			 * @returns current value for the probe
			 */
			function get() {
				return probeImpl.get();
			}

			function publish() {
				if (name) {
					when(get(), function (stats) {
						manifold.publish(name, stats);
					});
				}
			}

			/**
			 * Reset probe metrics
			 *
			 * @returns probe for API chaining
			 */
			function reset() {
				if (probeImpl.reset) {
					probeImpl.reset();
					probeImpl.publish();
				}

				return probe;
			}

			if (!('publish' in probeImpl)) {
				probeImpl.publish = publish;
			}
			probe.get = get;
			probe.reset = reset;

			return probe;
		};

	});

}(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
));
