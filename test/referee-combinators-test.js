/*jslint maxlen:100 */
(function (referee, buster) {
    if (typeof require === "function" && typeof module === "object") {
        referee = require("../lib/referee-combinators");
        buster = require("buster");
    }
    var combinators = referee.combinators;
    var assert = buster.assert;
    var refute = buster.refute;


    buster.testCase('partial', {
        'assert': {
            'expected and actual': {
                "pass": function () {
                    var actual = combinators.assert.equals(42);
                    refute.exception(function () { actual(42); }, "AssertionError");
                },
                "fail": function () {
                    var actual = combinators.assert.equals(42);
                    assert.exception(function () { actual(100); }, "AssertionError");
                }
            },
            'only actual': {
                'pass': function () {
                    var actual = combinators.assert.isTrue();
                    refute.exception(function () { actual(true); });
                },
                'fail': function () {
                    var actual = combinators.assert.isTrue();
                    assert.exception(function () { actual(false); }, "AssertionError");
                }
            }
        },
        'refute': {
            'expected and actual': {
                "pass": function () {
                    var actual = combinators.refute.equals(42);
                    refute.exception(function () { actual(100); });
                },
                "fail": function () {
                    var actual = combinators.refute.equals(42);
                    assert.exception(function () { actual(42); }, "AssertionError");
                }
            },
            'only actual': {
                'pass': function () {
                    var actual = combinators.refute.isTrue();
                    refute.exception(function () { actual(false); });
                },
                'fail': function () {
                    var actual = combinators.refute.isTrue();
                    assert.exception(function () { actual(true); }, "AssertionError");
                }
            }
        }
    });

}(this.referee, this.buster));
