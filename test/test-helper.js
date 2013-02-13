/*jslint maxlen:100 */
var testHelper = (function (referee, util, buster, _) {
    if (typeof require === "function" && typeof module === "object") {
        _ = require("lodash");
        referee = require("../lib/referee-combinators");
        util = require("../lib/util");

        //// This is a temporary workaround for the development-environment:
        //buster = require("buster-node");
        //var B = require("buster");
        //buster.format = { ascii: B.format.ascii.bind(B) };
        // remove the above and uncomment the following once workaround is obsolete:
        buster = require("buster");
    }

    var combinators = referee.combinators;
    var assert = buster.assert;
    var refute = buster.refute;
    var fmt = util.fmt;
    var fmtArgs = util.fmtArgs;

    function makeTests(assertion, argsOf1stApp, callback) {
        var prefix = ""; // prepend "//" to see which tests are created
        var tests = {};
        var termNames = {}, terms = {
            assert: { raw: combinators.assert[assertion] },
            refute: { raw: combinators.refute[assertion] }
        };
        _.keys(terms).forEach(function (k) {
            var raw = terms[k].raw;
            var appliedOnce = raw.apply(null, argsOf1stApp);
            terms[k].appliedOnce = appliedOnce;

            // TODO: this actually duplicates impl of .displayName
            var rawName = k + "." + assertion;
            var app1Name = rawName + fmtArgs.apply(this, argsOf1stApp);
            termNames[k] = {
                raw: rawName,
                appliedOnce: app1Name
            };
        });

        function addTest(termName, shouldWhat, testFn) {
            var name = prefix + termName + " should " + shouldWhat;
            if (tests[name]) {
                throw new Error("duplicate test name [" + name + "]"
                    + "\n  old test fn: " + tests[name]
                    + "\n  new test fn: " + testFn);
            }
            tests[name] = testFn;
        }
        function makePass(type) {
            var term = terms[type].appliedOnce;
            return function (actual) {
                var termName = termNames[type].appliedOnce + fmtArgs(actual);
                addTest(termName, "pass", function () {
                    buster.refute.exception(function () { term(actual); });
                });
                addTest(termName, "return actual value", function () {
                    assert.equals(term(actual), actual);
                });
            };
        }
        function makeFail(type) {
            var term = terms[type].appliedOnce;
            return function (actual) {
                var termName = termNames[type].appliedOnce + fmtArgs(actual);
                addTest(termName, "fail", function () {
                    buster.assert.exception(function () { term(actual); }, "AssertionError");
                });
                // TODO: add tests for message, be it a custom one or the default
            };
        }
        function makeDisplayNameTest(type, appType) {
            var actual = terms[type][appType].displayName;
            var testFn = (appType === "raw")
                ? function () {
                    assert.defined(actual, ".displayName");
                    assert.match(actual, new RegExp("^" + type + "\\."),
                                 "should start with '" + type + ".'"); // 'assert' or 'refute'
                    assert.match(actual, new RegExp("\\." + assertion + "$"),
                                 "should end with name of normal assertion");
                }
                : function () { // appType === "appliedOnce"
                    assert.defined(actual, ".displayName");
                    assert.match(actual, new RegExp("^" + type + "\\."),
                                 "should start with '" + type + ".'"); // 'assert' or 'refute'
                    assert.match(actual, new RegExp("\\." + assertion),
                                 "should contain name of normal assertion");
                    assert.match(actual, /\)$/, "should end with closing parenthesis");
                    refute.match(actual, /\n/, "should not span multiple lines");
                };
            addTest(termNames[type][appType] + " [" + appType + "]",
                    "have proper .displayName",
                    testFn);
        }

        var t, term, name;
        t = "assert";
        callback(makePass(t), makeFail(t));
        makeDisplayNameTest(t, "raw");
        makeDisplayNameTest(t, "appliedOnce");

        t = "refute";
        callback(makeFail(t), makePass(t)); // yes, pass and fail swapped for refute!
        makeDisplayNameTest(t, "raw");
        makeDisplayNameTest(t, "appliedOnce");

        return tests;
    }

    return {
        makeTests: makeTests
    };

}(this.referee, this.util, this.buster, this.lodash));

if (typeof module === "object") {
    module.exports = testHelper;
}