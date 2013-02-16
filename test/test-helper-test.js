/*jslint maxlen:100 */
/*jslint regexp:true*/ // allow . and [^...] in regexps 
(function (testHelper, util, buster, referee, _) {
    if (typeof require === "function" && typeof module === "object") {
        testHelper = require("./test-helper");
        util = require("../lib/util");
        _ = require("lodash");
        referee = require("referee");

        //// This is a temporary workaround for the development-environment:
        //buster = require("buster-node");
        //var B = require("buster");
        //buster.format = { ascii: B.format.ascii.bind(B) };
        // remove the above and uncomment the following once workaround is obsolete:
        buster = require("buster");
    }

    var assert = buster.assert;
    var refute = buster.refute;

    var format = util.format;
    var formatArgs = util.formatArgs;
    var makeTests = testHelper.makeTests;

    buster.assertions.add('isPlainObjectOrFunc', {
        assert: function (actual) {
            return _.isPlainObject(actual) || _.isFunction(actual);
        },
        assertMessage: "${2}Expected ${0} to be either plain object or function but is ${1}",
        refuteMessage: "${2}Expected ${0} to be neither plain function nor object but is ${1}",
        expectation: "toBeObjectOrFunc",
        values: function (thing, message) {
            /*jslint white:true*/
            var type = _.isArray(thing) ? "array" :
                       _.isRegExp(thing) ? "regexp" :
                       _.isNull(thing) ? "null" :
                       typeof thing;
            return [thing, type, message ? message + ": " : ""];
        }
    });

    buster.testCase("test-helper", {

        "makeTests": { // TODO: a lot more...

            "calls callback at least once with two function args": function () {
                var cb = this.spy();
                makeTests('isTrue', [], cb);

                assert.greater(cb.callCount, 1, "callback.callCount");
                assert.isFunction(cb.args[0][0], "1st arg to callback on 1st call");
                assert.isFunction(cb.args[0][1], "2nd arg to callback on 1st call");
            },

            "returns" : {
                "non-empty plain object": function () {
                    var actual = makeTests('isTrue', [], function () {});
                    assert.isPlainObjectOrFunc(actual);
                    refute.isFunction(actual, format(actual));

                    refute(_.isEmpty(actual), format(actual) + " should be non-empty");
                },

                "plain object with own props either functions or plain objects with...":
                    function () {
                        var actual = makeTests('isTrue', [], function (pass, fail) {});
                        //actual.whuteva = { f: function () {}, two: { three : {}, 4: []} };

                        assert.isPlainObjectOrFunc(actual);
                        refute.isFunction(actual, format(actual));

                        util.forOwnRec(actual, function (v, path) {
                            var pathStr = "at ["
                                + _(path).tail().map(format).join("][") + "]";
                            assert.isPlainObjectOrFunc(v, pathStr);
                            if (!_.isFunction(v)) {
                                refute(_.isEmpty(v), "object " + pathStr
                                    + " should be non-empty");
                            }
                        });
                    }
            }
        }
    });

}(this.testHelper, this.util, this.buster, this.referee, this.lodash));