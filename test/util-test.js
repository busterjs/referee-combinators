/*jslint maxlen:100 */
/*jslint regexp:true*/ // allow . and [^...] in regexps 
(function (util, buster, _) {
    if (typeof require === "function" && typeof module === "object") {
        util = require("../lib/util");
        _ = require("lodash");

        //// This is a temporary workaround for the development-environment:
        //buster = require("buster-node");
        //var B = require("buster");
        //buster.format = { ascii: B.format.ascii.bind(B) };
        // remove the above and uncomment the following once workaround is obsolete:
        buster = require("buster");
    }

    var assert = buster.assert;
    var refute = buster.refute;

    var format = util.fmt;
    var formatArgs = util.fmtArgs;


    buster.testCase("util", {
        "format": {
            "throws with no arg": function () {
                assert.exception(format);
            },
            "does not throw with more than one arg": function () {
                refute.exception(function () { format(1, 2); });
            },
            "uses only its first arg and ignores the rest": function () {
                var a1 = 1;
                var a2 = "two";
                var a3 = { three: 3 };
                var actual = format(a1, a2, a3);

                assert.equals(actual, format(a1));
            },

            // not entirely bogus! _.map calls its callback with 3 args instead of only 1
            "can be used with lodash's map": function () {
                var a1 = "one";
                var a2 = 2;
                var a3 = {3: "three"};

                assert.equals(_.map([a1, a2, a3], format),
                              [format(a1), format(a2), format(a3)]);
            },

            "with undefined": function () {
                var a = format(undefined);
                assert.equals(a, "undefined", "should return string 'undefined' without quotes");
            },

            "with null": function () {
                var a = format(null);
                assert.equals(a, "null", "should return string 'null' without quotes");
            },

            "with true": function () {
                var a = format(true);
                assert.equals(a, "true", "should return string 'true' without quotes");
            },
            "with false": function () {
                var a = format(false);
                assert.equals(a, "false", "should return string 'false' without quotes");
            },

            "with empty string": function () {
                var a = format("");
                assert.match(a, /^".*"$/, "should put double quotes around");
            },
            "with string containing single quote": function () {
                var a = format("foo'bar");
                assert.match(a, /^".*"$/, "should put double quotes around");
                assert.match(a, "foo'bar", "should leave single quote as is");
            },
            "//with string escapes double quotes in string": function () {
                var a = format("foo\"bar");

                assert.match(a, /^".*"$/, "should put double quotes around");
                assert.match(a, 'foo\\"bar', "should escape double quote");
            },
            "with empty object": function () {
                var a = format({});
                assert.match(a, /^\{ *\}$/, "should return empty object literal");
            },

            "with empty array": function () {
                var a = format([]);
                assert.match(a, /^\[ *\]$/, "should return empty array literal");
            },
            "with one-elem array": function () {
                var e = 23;
                var a = format([e]);
                assert.match(a, /^\[.*\]$/, "should put brackets around");
                assert.match(a, format(e), "should contain format(elem)");
                refute.match(a, ",", "should not contain comma");
            },
            "with two-elem array": function () {
                var e0 = "a comma:,";
                var e1 = { two: 2 };
                var a = format([e0, e1]);
                assert.match(a, /^\[.*\]$/, "should put brackets around");
                assert.match(a, new RegExp(format(e0) + " *, *" + format(e1)),
                             "should list format of elems in order, separated by comma");
            },

            "with anon function": function () {
                var a = format(function () { return 42; });

                refute.match(a, /^".*"$/, "should NOT put double quotes around");
                refute.equals(a, "", "should not return empty string");
                refute.match(a, "return 42", "should NOT contain function body");
            },
            "with named function": function () {
                function daFunc() { return 42; }
                var a = format(daFunc);

                assert.equals(a, "daFunc", "should just return function name");
            },
            "with anon function that has own prop .displayName": function () {
                var daFunc = function () { return 42; };
                daFunc.displayName = "zapp";
                var a = format(daFunc);

                assert.equals(a, "zapp", "should just return .displayName");
            },
            "with named function that has own prop .displayName": function () {
                function daFunc() { return 42; }
                daFunc.displayName = "zapp";
                var a = format(daFunc);

                assert.equals(a, "zapp", "should just return .displayName");
            }
        },

        "formatArgs": {
            "with no arg": function () {
                var a = formatArgs();
                assert.equals(a, "()", "should put parens around");
            },
            "with empty array": function () {
                var x = [];
                var xFormatted = format(x);
                var a = formatArgs(x);

                assert.match(a, /^\(.*\)$/, "should put parens around");
                assert.match(a, xFormatted, "should contain formatted arg");
            }
        }
    });

}(this.util, this.buster));