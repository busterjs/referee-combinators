var testHelper = (function (referee, util, buster, _) {
    if (typeof require === "function" && typeof module === "object") {
        _ = require("lodash");
        referee = require("../lib/referee-combinators");
        util = require("../lib/util");

        //// This is a temporary workaround for the development-environment:
        //buster = require("buster-node");
        //var B = require("buster");
        //buster.format = { ascii: B.format.ascii.bind(B) };
        // remove the above and uncomment the following,
        // once workaround is obsolete:
        buster = require("buster");
    }

    var combinators = referee.combinators;
    var assert = buster.assert;
    var refute = buster.refute;
    var format = util.format;
    var formatArgs = util.formatArgs;

/* custom assertions ------------------------------------------------------- */

    var isPlainObjectOrFunc = {
        assert: function (actual) {
            return _.isPlainObject(actual) || _.isFunction(actual);
        },
        assertMessage: "${2}Expected ${0} to be either plain object or"
            + " function but is ${1}",
        refuteMessage: "${2}Expected ${0} to be neither plain function nor"
            + " object but is ${1}",
        expectation: "toBeObjectOrFunc",
        values: function (thing, message) {
            /*jslint white:true*/ // NO, I do NOT want to indent here!
            var type = _.isArray(thing) ? "array" :
                       _.isRegExp(thing) ? "regexp" :
                       _.isNull(thing) ? "null" :
                       typeof thing;
            return [thing, type, message ? message + ": " : ""];
        }
    };

    var isProperSubset = {
        assert: function (subset, superset) {
            var subMinusSuper = _.difference(subset, superset);
            var superMinusSub = _.difference(superset, subset);
            return _.isEmpty(subMinusSuper) && !_.isEmpty(superMinusSub);
        },
        assertMessage: "${2}Expected\n\n${0}\n\nto be a proper subset of"
            + "\n\n${1}\n\nBUT ${3}",
        refuteMessage: "${2}Expected\n\n${0}\n\nNOT to be a proper subset of"
            + "\n\n${1}\n\nBUT it is!",
        expectation: "toBeProperSubsetOf",
        values: function (subset, superset, message) {
            // TODO: what a pity that we have to do the work
            // ...from `assert` again in `values`...
            var reason;
            var subMinusSuper = _.difference(subset, superset);
            var superMinusSub = _.difference(superset, subset);
            if (!_.isEmpty(subMinusSuper)) {
                if (_.isEmpty(superMinusSub)) {
                    reason = "it is just the other way round."
                        + " These are in the former but not in the latter: "
                        + format(subMinusSuper);
                } else {
                    reason = "some in the former are missing in the latter: "
                        + format(subMinusSuper);
                }
            } else { // subMinusSuper IS empty
                if (_.isEmpty(superMinusSub)) {
                    reason = "they are equal (as sets)";
                /*
                } else {
                    throw new Error("should not happen");
                    // It does happen - we're being called even
                    // if assert returned true (or refute returned false)
                    // This means we're doing even more unnecessary work... :(
                */
                }
            }
            return [subset, superset, message ? message + ": " : "", reason];
        }
    };

/* public ------------------------------------------------------------------ */

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
            var app1Name = rawName + formatArgs(argsOf1stApp);
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
                var termName = termNames[type].appliedOnce
                    + formatArgs([actual]);
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
                var termName = termNames[type].appliedOnce
                    + formatArgs([actual]);
                addTest(termName, "fail", function () {
                    buster.assert.exception(function () { term(actual); },
                        "AssertionError");
                });
                // TODO: add tests for message, be it a custom one or default
            };
        }
        function makeDisplayNameTest(type, appType) {
             // type is either 'assert' or 'refute'
             // appType is either 'raw' or 'appliedOnce'
            var actual = terms[type][appType].displayName;
            var testFn = (appType === "raw")
                ? function () {
                    assert.defined(actual, ".displayName");
                    assert.match(actual, new RegExp("^" + type + "\\."),
                                 "should start with '" + type + ".'");
                    assert.match(actual, new RegExp("\\." + assertion + "$"),
                                 "should end with name of normal assertion");
                }
                : function () { // appType === "appliedOnce"
                    assert.defined(actual, ".displayName");
                    assert.match(actual, new RegExp("^" + type + "\\."),
                                 "should start with '" + type + ".'");
                    assert.match(actual, new RegExp("\\." + assertion),
                                 "should contain name of normal assertion");
                    assert.match(actual, /\)$/,
                        "should end with closing parenthesis");
                    refute.match(actual, /\n/,
                        "should not span multiple lines");
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
        callback(makeFail(t), makePass(t)); // pass & fail swapped for refute!
        makeDisplayNameTest(t, "raw");
        makeDisplayNameTest(t, "appliedOnce");

        return tests;
    }

/* what's exposed ---------------------------------------------------------- */

    buster.assertions.add("isPlainObjectOrFunc", isPlainObjectOrFunc);
    buster.assertions.add("isProperSubset", isProperSubset);
    return {
        makeTests: makeTests,
        rawCustomAssertions: {  // temp: make available so they can be tested on
            isPlainObjectOrFunc: isPlainObjectOrFunc,   // ...different instance
            isProperSubset: isProperSubset              // ...of referee...
        }
    };

}(this.referee, this.util, this.buster, this.lodash));

if (typeof module === "object") {
    module.exports = testHelper;
}