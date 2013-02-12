/*jslint maxlen:100 */
var testHelper = (function (referee, buster, _) {
    if (typeof require === "function" && typeof module === "object") {
        referee = require("../lib/referee-combinators");
        _ = require("lodash");

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

    function fmt(x) {
        // buster.format.ascii is not exactly what we need wrt functions
        // So we'll have to roll our own here :(
        //
        // TODO: buster.format.ascii.functionName does not exist (it's buster.functionName)

        if (typeof x === "function" && !(x instanceof RegExp)) {
            var fName = buster.functionName(x);
            if ((typeof fName === "string") && (fName !== "")) {
                return fName;
            }
        }
        return buster.format.ascii(x);
    }

    function makeTests(assertion, argsOf1stApp, callback) {
        var prefix = ""; // prepend "//" to see which tests are created
        var tests = {};
        var rawTerms = {
            assert: combinators.assert[assertion],
            refute: combinators.refute[assertion]
        };
        var terms = {
            assert: rawTerms.assert.apply(null, argsOf1stApp),
            refute: rawTerms.refute.apply(null, argsOf1stApp)
        };
        var desc = "." + assertion + "(" + _.map(argsOf1stApp, fmt).join(", ") + ")";
        function addTest(type, actual, shouldWhat, testFn) {
            var gotActual = !!testFn;
            if (!gotActual) {
                testFn = shouldWhat;
                shouldWhat = actual;
            }
            var name = prefix + type + desc
                + (gotActual ? "(" + fmt(actual) + ")" : "")
                + " should " + shouldWhat;
            if (tests[name]) {
                throw new Error("duplicate test name [" + name + "]"
                    + "\n  old test fn: " + tests[name]
                    + "\n  new test fn: " + testFn);
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

        var t;
        t = "assert";
        callback(makePass(t), makeFail(t));
        addTest(t, "have .displayName", function () {
            assert.match(terms[t].displayName, t + "." + assertion,
                "name should be that of normal assertion");
        });

        t = "refute";
        callback(makeFail(t), makePass(t)); // yes, swap pass and fail for refute
        addTest(t, "have .displayName", function () {
            assert.match(terms[t].displayName, t + "." + assertion,
                "name should be that of normal assertion");
        });

        return tests;
    }

    return {
        makeTests: makeTests
    };

}(this.referee, this.buster, this.lodash));

if (typeof module === "object") {
    module.exports = testHelper;
}