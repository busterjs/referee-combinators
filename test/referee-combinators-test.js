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



    referee.add("customIsTwo", {
        assert: function (actual) {
            return actual === 2;
        },
        assertMessage: "${0} was expected to be 2",
        refuteMessage: "${0} was not  expected to be 2"
    });

    function testPartial(type, assertion, correct, incorrect) {
        var args = _.drop(_.toArray(arguments), 4);
        function test(check, actual) {
            return function () {
                var term = combinators[type][assertion].apply(null, args);
                buster[check].exception(function () { term(actual); }, "AssertionError");
            };
        }
        return {
            "pass": test('refute', correct),
            "fail": test('assert', incorrect),
            "chain": function () {
                var term = combinators[type][assertion].apply(null, args);
                assert.equals(term(correct), correct);
            }
        };
    }

    buster.testCase('partial', {
        'assert': {
            'expected and actual': testPartial('assert', 'equals', 42, 100, 42),
            'only actual': testPartial('assert', 'isTrue', true, false),
            'custom': testPartial('assert', 'customIsTwo', 2, 8)
        },
        'refute': {
            'expected and actual': testPartial('refute', 'equals', 100, 42, 42),
            'only actual': testPartial('refute', 'isTrue', false, true),
            'custom': testPartial('refute', 'customIsTwo', 8, 2)
        }
    });

}(this.referee, this.buster, this._));
