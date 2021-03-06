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

(function (buster, define, window) {
	"use strict";

	var assert, refute, undef;

	assert = buster.assert;
	refute = buster.refute;

	define('probe/export/session-test-browser', function (require) {

		var session, uuidRE, isLocalStorageAvailable;

		session = require('probe/export/_session');

		uuidRE = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/;
		isLocalStorageAvailable = window && window.localStorage;

		buster.testCase('probe/export/session-browser', {
			'should use localStorage, when available, as the default store': function () {
				var uuidSeed, uuidStore, sessionId;

				uuidSeed = 'C1381ED6-747E-4333-871E-6C9F7141B07D';
				uuidStore = 'C1381ED7-747E-4333-871E-6C9F7141B07D';

				if (isLocalStorageAvailable) {
					window.localStorage['probes/sessionId'] = uuidSeed;
				}

				sessionId = session();

				if (isLocalStorageAvailable) {
					assert.equals(uuidStore, window.localStorage['probes/sessionId']);
					assert.equals(uuidStore, sessionId);
				}
				else {
					assert(uuidRE.test(sessionId));
					refute.equals(uuidStore, sessionId);
				}
			}
		});

	});

}(
	this.buster || require('buster'),
	typeof define === 'function' && define.amd ? define : function (id, factory) {
		var packageName = id.split(/[\/\-]/)[0], pathToRoot = id.replace(/[^\/]+/g, '..');
		pathToRoot = pathToRoot.length > 2 ? pathToRoot.substr(3) : pathToRoot;
		factory(function (moduleId) {
			return require(moduleId.indexOf(packageName) === 0 ? pathToRoot + moduleId.substr(packageName.length) : moduleId);
		});
	},
	typeof window !== 'undefined' ? window : undefined
	// Boilerplate for AMD and Node
));
