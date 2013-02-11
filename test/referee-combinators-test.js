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

    referee.add("equalsTwo", {
        assert: function (actual) {
            /*jslint eqeq: true*/ // only in current scope
            return actual == 2;  // we DO want coercion here
        },
        assertMessage: "${0} was expected to equal 2",
        refuteMessage: "${0} was not expected to equal 2"
    });

    buster.testCase("check", {
        "built-ins": function () {
            refute.isTrue(1, "normal refute.isTrue(1) should pass");
            refute.isTrue(0, "normal refute.isTrue(0) should pass");
        },
        // defer for buster <= 0.6.12:
        "//equals coercing or not?": function () {
            var a = 42;
            var e = "42";
            var refuteEquals = combinators.refute.equals(e);

            // will fail with buster <= 0.6.12 (where `equals` does coercion):
            refute.equals(e, a, "normal equals should NOT do coercion");

            // based on `referee.equals` (no coercion) so this will pass:
            refuteEquals(a, "derived equals should also NOT do coercion");
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
            fail("42"); // ATTENTION: old equals from buster <= 0.6.12 did have coercion!
            fail(100);
        }),
        'custom binary:' : makeTests('equalsTwo', [], function (pass, fail) {
            pass(2);
            pass("2");
            fail(8);
        })

    });

}(this.referee, this.buster, this._, this.testHelper));
