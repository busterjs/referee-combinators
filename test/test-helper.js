/*jslint maxlen:100 */
var testHelper = (function (referee, buster) {
    if (typeof require === "function" && typeof module === "object") {
        referee = require("../lib/referee-combinators");

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

    function makeTests(assertion, argsOf1stApp, callback) {
        var prefix = ""; // prepend "//" to see which tests are created
        var tests = {};
        var terms = {
            assert: combinators.assert[assertion].apply(null, argsOf1stApp),
            refute: combinators.refute[assertion].apply(null, argsOf1stApp)
        };
        var desc = "." + assertion + "(" + argsOf1stApp.join(", ") + ")";
        function addTest(type, actual, shouldWhat, testFn) {
            var name = prefix + type + desc
                + "(" + buster.format.ascii(actual) + ") should " + shouldWhat;
            if (tests[name]) {
                throw new Error("duplicate test name [" + name + "]");
            }
            tests[name] = testFn;
        }
        function makePass(type) {
            var term = terms[type];
            return function (actual) {
                addTest(type, actual, "pass", function () {
                    buster.refute.exception(function () { term(actual); });
                });
                addTest(type, actual, "return actual value", function () {
                    assert.equals(term(actual), actual);
                });
            };
        }
        function makeFail(type) {
            var term = terms[type];
            return function (actual) {
                addTest(type, actual, "fail", function () {
                    buster.assert.exception(function () { term(actual); }, "AssertionError");
                });
                // TODO: add tests for message, be it a custom one or the default
            };
        }

        (function () {/*jslint white: true */
            var t;
            t = "assert"; callback(makePass(t), makeFail(t)); // jslint complains but this format...
            t = "refute"; callback(makeFail(t), makePass(t)); // ...is best to emphasize the diffs
        }());
        return tests;
    }

    return {
        makeTests: makeTests
    };

}(this.referee, this.buster));

if (typeof module === "object") {
    module.exports = testHelper;
}