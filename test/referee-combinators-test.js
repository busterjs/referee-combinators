/*jslint maxlen:100 */
(function (referee, buster, _, testHelper) {
    if (typeof require === "function" && typeof module === "object") {
        referee = require("../lib/referee-combinators");
        _ = require("lodash");
        testHelper = require("./test-helper");

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
    var makeTests = testHelper.makeTests;

    function addCustomAssertions() {
        referee.add("equalsTwoWithCoercion", {
            assert: function (actual) {
                /*jslint eqeq: true*/ // only in current scope
                return actual == 2;  // we DO want coercion here
            },
            assertMessage: "${0} was expected to equal 2",
            refuteMessage: "${0} was not expected to equal 2"
        });
    }

    buster.testCase("check normal assertions", {
        "built-in": {
            "isTrue": function () {
                assert.isTrue(true, "normal refute.isTrue(true) should pass");
                refute.isTrue(false, "normal refute.isTrue(false) should pass");
                refute.isTrue(1, "normal refute.isTrue(1) should pass");
                refute.isTrue(0, "normal refute.isTrue(0) should pass");
            },
            "//equals coercing or not? (fails with buster <= 0.6.12)": function () {
                var a = 42;
                var e = "42";
                var refuteEquals = combinators.refute.equals(e);

                // will fail with buster <= 0.6.12 (where `equals` does coercion):
                refute.equals(e, a, "normal equals should NOT do coercion");

                // based on `referee.equals` (no coercion) so this will pass:
                refuteEquals(a, "derived equals should also NOT do coercion");
            }
        }
    });

    // need to add them here (outside test case),
    // if it's done in setUp the custom assertion is not found - why?
    addCustomAssertions();

    buster.testCase("combinator ('partial') assertions", {

        'derived from custom': {
            //setUp: addCustomAssertions, // not working - why ?

            'binary': makeTests('equalsTwoWithCoercion', [], function (pass, fail) {
                pass(2);
                pass("2");
                fail(8);
            })
        },

        'derived from built-in unary': {
            'isTrue': makeTests('isTrue', [], function (pass, fail) {
                pass(true);
                fail(false);
                fail("false");
                fail("true");
                fail(0);
                fail(1);
            })
        },

        'derived from built-in binary': {
            'equals': makeTests('equals', [42], function (pass, fail) {
                pass(42);
                fail("42"); // ATTENTION: old equals from buster <= 0.6.12 DID have coercion!
                fail(100);
            })
        }

    });

}(this.referee, this.buster, this._, this.testHelper));
