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

    referee.add("customEqualsTwo", {
        assert: function (actual) {
            return actual == 2;
        },
        assertMessage: "${0} was expected to equal 2",
        refuteMessage: "${0} was not expected to equal 2"
    });

    function testPartial(type, assertion, correct, incorrect) {
        var tests = {};
        var args = _.drop(_.toArray(arguments), 4);
        var desc = type + "." + assertion + "(" + args.join(", ") + ")("; 
        var term = combinators[type][assertion].apply(null, args);
        function passesWith(actual) {
            tests[desc + correct + ") should pass"] = function () {
                buster.refute.exception(function () { term(actual); });
            };
        }
        function failsWith(actual) {
            tests[desc + incorrect + ") should fail"] = function () {
                buster.assert.exception(function () { term(actual); }, "AssertionError");
            };
        }
        passesWith(correct);
        failsWith(incorrect);
        tests[desc + correct + ") should return actual value"] = function () {
            assert.equals(term(correct), correct);
        };
        /*
        tests[desc + incorrect + ") should return actual value"] = function () {
            assert.equals(term(incorrect), incorrect);
        };
        */
        return tests;
    }

    buster.testCase('partial', {
        'assert': {
            'expected and actual': testPartial('assert', 'equals', 42, 100, 42),
            'only actual': testPartial('assert', 'isTrue', true, false),
            'custom1': testPartial('assert', 'customEqualsTwo', 2, 8),
            'custom2': testPartial('assert', 'customEqualsTwo', "2", 8)
        },
        'refute': {
            'expected and actual': testPartial('refute', 'equals', 100, 42, 42),
            'only actual': testPartial('refute', 'isTrue', false, true),
            'custom1': testPartial('refute', 'customEqualsTwo', 8, 2),
            'custom2': testPartial('refute', 'customEqualsTwo', 8, "2")
        }
    });

}(this.referee, this.buster, this._));
