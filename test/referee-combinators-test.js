/*jslint maxlen:100 */
(function (referee, buster, _) {
    if (typeof require === "function" && typeof module === "object") {
        referee = require("../lib/referee-combinators");
        _ = require("lodash");
        buster = require("buster");
    }
    var combinators = referee.combinators;
    var assert = buster.assert;
    var refute = buster.refute;

    referee.add("equalsTwo", {
        assert: function (actual) {
            return actual == 2;
        },
        assertMessage: "${0} was expected to equal 2",
        refuteMessage: "${0} was not expected to equal 2"
    });

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
            };
        }
        var t;
        t = "assert"; callback(makePass(t), makeFail(t));
        t = "refute"; callback(makeFail(t), makePass(t));

        return tests;
    }

    buster.testCase("check", {
        "built-ins": function () {
            assert.equals(42, "42", "normal equals should do coercion");
            refute.isTrue(1, "normal refute.isTrue(1) should pass");
            refute.isTrue(0, "normal refute.isTrue(0) should pass");
        }
    });

    buster.testCase("'partial' assertion from", {
        'built-in unary:': makeTests('isTrue', [], function (pass, fail) {
            pass(true);
            fail(false);
            fail("false");
            fail("true");
            fail(0);
            fail(1);
        }),
        'built-in binary:': makeTests('equals', [42], function (pass, fail) {
            pass(42);
            fail(100);
        }),
        'custom unary:' : makeTests('equalsTwo', [], function (pass, fail) {
            pass(2);
            pass("2");
            fail(8);
        })

    });

}(this.referee, this.buster, this._));
