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

    var format = util.format;
    var formatArgs = util.formatArgs;
    var forOwnRec = util.forOwnRec;

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

            "throws when receiving anything other than exactly one array:": {
                "no arg": function () {
                    assert.exception(formatArgs);
                },
                "more than 1 arg": function () {
                    assert.exception(function () { formatArgs([], 1, 2); });
                },
                "'undefined' or 'null'": function () {
                    assert.exception(function () { formatArgs(undefined); });
                    assert.exception(function () { formatArgs(null); });
                },
                "boolean": function () {
                    assert.exception(function () { formatArgs(true); });
                    assert.exception(function () { formatArgs(false); });
                },
                "string": function () {
                    assert.exception(function () { formatArgs(""); });
                    assert.exception(function () { formatArgs("somethn"); });
                },
                "number": function () {
                    assert.exception(function () { formatArgs(0); });
                    assert.exception(function () { formatArgs(-0); });
                    assert.exception(function () { formatArgs(1); });
                    assert.exception(function () { formatArgs(-3.1415926); });
                },
                "object": function () {
                    assert.exception(function () { formatArgs({}); });
                    assert.exception(function () { formatArgs({a: "b"}); });
                },
                "regex": function () {
                    assert.exception(function () { formatArgs(/.*/); });
                },
                "function": function () {
                    assert.exception(function () { formatArgs(function () {}); });
                }
            },

            "works with empty array": function () {
                var x = [];
                var a = formatArgs(x);
                assert.equals(a, "()", "should return empty parens");
            },
            "works with array containing empty array": function () {
                var x = [[]];
                var e = new RegExp("^\\("
                                    + format(x[0]).replace("[", "\\[").replace("]", "\\]")
                                    + "\\)$");
                var a = formatArgs(x);

                assert.match(a, e, "should return formatted elem with parens around");
            },
            "works with array containing mixed elems": function () {
                var arr = [-0.0, "one", [[[]], []]];
                var act = formatArgs(arr);
                var exp = new RegExp("^\\(" + _.map(arr, format).join(" *, *")
                                                .replace(/\[/g, "\\[")
                                                .replace(/\]/g, "\\]")
                                    + "\\)$");

                assert.match(act, /^\(.*\)$/, "should put parens around");
                assert.match(act, exp, "should format elems in order, separated by commas");
            },
            "//works with the implicit 'arguments'": function () {
                var exercise = function () { return formatArgs(arguments); };
                var arr = ["qumbl", null, 42, undefined, { foo: "bar" }];
                var act = exercise.apply(null, arr);
                var exp = new RegExp("^\\(" + _.map(arr, format).join(" *, *")
                                                .replace(/\[/g, "\\[")
                                                .replace(/\]/g, "\\]")
                                    + "\\)$");

                assert.match(act, /^\(.*\)$/, "should put parens around");
                assert.match(act, exp, "should format elems in order, separated by commas");
            }
        },

        "forOwnRec": {
            setUp: function () {
                var self = this;
                self.makeCb = function (maxPathLen) {
                    var spy = self.spy(function (v, path) {
                        buster.log("call " + spy.callCount + ": [" + path.join("][") + "]");
                        if (maxPathLen && (path.length > maxPathLen)) {
                            throw new Error("infinite regression?!");
                        }
                    });
                    return spy;
                };
            },

            "does not call callback for empty object": function () {
                var o = {};
                var spy = this.spy();
                forOwnRec(o, spy);

                refute.called(spy);
            },

            "does not visit properties from up the prototype chain": function () {
                function Dog(name) {
                    this.name = name;
                    this.poop = function () { return "poop"; };
                }
                Dog.prototype.bark = function () {
                    return "Woof!";
                };
                var fido = new Dog("Fido");
                assert.equals(fido.name, "Fido"); // let's check that Fido's as we
                assert.equals(fido.bark(), "Woof!"); // want
                assert.equals(fido.poop(), "poop"); // him
                var spy = this.makeCb();

                forOwnRec(fido, spy);
                assert.calledWith(spy, "Fido", [fido, "name"]);
                assert.calledWith(spy, fido.poop, [fido, "poop"]);
                refute.calledWith(spy, fido.bark, [fido, "bark"]); // NOT this one!

                // Make sure these were *exactly* the calls (none else).
                // Let's put this last to not suppress info from failures above.
                assert.equals(spy.callCount, 2, "cb callCount");
            },

            "visits each own prop once": {
                "- at least top-level ones in plain object (all kinds of values)": function () {
                    var o = (function () {
                        /*jslint evil:true*/
                        return {
                            a: NaN,
                            b: undefined,
                            c: null,
                            d: false,
                            e: true,
                            f: function (a, b) { return a + b; },
                            g: function g(a, b) { return a + b; },
                            h: new Function("a", "b", "return a + b"),
                            i: "",
                            j: "string literal",
                            k: new String('new String(..)'),
                            l: {},
                            m: new Object(),
                            n: {foo: "bar", baz: {x: 42}, qumbl: {x: 23}},
                            o: {0: "0", 1: 1, 2: {0: 0, 1: null}, 3: undefined}, // array-like
                            p: [],
                            q: [0, 1, 2],
                            r: new Array(),
                            s: new Array(5), // length
                            t: new Array(1, 2, 3), // 3 elems
                            u: /^a regular express*ion$/,
                            v: new RegExp("^another regular express*ion$"),
                            w: 15,
                            x: new Number(15),
                            y: 3.1415927,
                            z: 0
                        };
                    }());
                    ["f", "g", "h"].forEach(function (k) {
                        var fn = o[k];
                        fn.name = "o." + k + ".name: "
                            + "cannot be changed, remains non-enumerable hence won't appear";
                        fn.displayName = "o." + k + ".displayName: "
                            + "will be visited coz it's enumerable"
                            + " - and be used as name by `format`";
                    });
                    var spy = this.makeCb();
                    forOwnRec(o, spy);
                    // assert(false); // uncomment to see log

                    // NaN is special, we cannot just assert.calledWith(spy, o.a, [o, "a"])
                    assert.isNaN(spy.args[0][0], "first arg of first call");
                    assert.equals(spy.args[0][1], [o, "a"], "second arg of first call");

                    // rest is easy:
                    assert.calledWith(spy, o.b, [o, "b"]);
                    assert.calledWith(spy, o.c, [o, "c"]);
                    assert.calledWith(spy, o.d, [o, "d"]);
                    assert.calledWith(spy, o.e, [o, "e"]);
                    assert.calledWith(spy, o.f, [o, "f"]);
                    assert.calledWith(spy, o.g, [o, "g"]);
                    assert.calledWith(spy, o.h, [o, "h"]);
                    assert.calledWith(spy, o.i, [o, "i"]);
                    assert.calledWith(spy, o.j, [o, "j"]);
                    assert.calledWith(spy, o.k, [o, "k"]);
                    assert.calledWith(spy, o.l, [o, "l"]);
                    assert.calledWith(spy, o.m, [o, "m"]);
                    assert.calledWith(spy, o.n, [o, "n"]);
                    assert.calledWith(spy, o.o, [o, "o"]);
                    assert.calledWith(spy, o.p, [o, "p"]);
                    assert.calledWith(spy, o.q, [o, "q"]);
                    assert.calledWith(spy, o.r, [o, "r"]);
                    assert.calledWith(spy, o.s, [o, "s"]);
                    assert.calledWith(spy, o.t, [o, "t"]);
                    assert.calledWith(spy, o.u, [o, "u"]);
                    assert.calledWith(spy, o.v, [o, "v"]);
                    assert.calledWith(spy, o.w, [o, "w"]);
                    assert.calledWith(spy, o.x, [o, "x"]);
                    assert.calledWith(spy, o.y, [o, "y"]);
                    assert.calledWith(spy, o.z, [o, "z"]);
                },

                "in function": function () {
                    var f = function () {};
                    f.name = "cannot be changed & is not enumerable";
                    f.fooz = "will appear";
                    assert.equals(f.name, "", "f.name"); // it just can't be changed
                    assert.equals(f.fooz, "will appear", "f.fooz");
                    assert.equals(_.keys(f), ["fooz"], "_.keys(f)");
                    var spy = this.makeCb();
                    forOwnRec(f, spy);

                    assert.calledWith(spy, f.fooz, [f, "fooz"]);
                    refute.calledWith(spy, f.name, [f, "name"]); // NOT this one!

                    // Make sure these were *exactly* the calls (none else).
                    // Let's put this last to not suppress info from failures above.
                    assert.equals(spy.callCount, 1, "cb callCount");
                },

                "in tree-like object": function () {
                    var o = {a: {b: 2, c: {d: 4}}};
                    var spy = this.makeCb();
                    forOwnRec(o, spy);

                    assert.calledWith(spy, o.a,     [o, "a"]);
                    assert.calledWith(spy, o.a.b,   [o, "a", "b"]);
                    assert.calledWith(spy, o.a.c,   [o, "a", "c"]);
                    assert.calledWith(spy, o.a.c.d, [o, "a", "c", "d"]);

                    // Make sure these were *exactly* the calls (none else).
                    // Let's put this last to not suppress info from failures above.
                    assert.equals(spy.callCount, 4, "cb callCount");
                },

                "in confluent DAG object": function () {
                    // DAG = Directed Acyclic Graph; confluent: look at o below
                    var x = {c: { d: 4} };
                    var o = {a: x, b: x};
                    var spy = this.makeCb();
                    forOwnRec(o, spy);

                    assert.calledWith(spy, x, [o, "a"]); // we see the *value* x twice (OK)
                    assert.calledWith(spy, x, [o, "b"]); // as value of different keys of o

                    // However, we should see value c = {d: 4} ONLY ONCE because it
                    // *appears* only for one key. So it's NOT about enumerating all
                    // paths in the structure, rather it's about enumerating all keys
                    // (albeit "fully qualified"), without duplication.
                    // So if a particular value happens to be associated with *different*
                    // *keys* then we'll see it more than once - but only then.
                    var isPath_a_c = spy.calledWith(x.c,   [o, "a", "c"]);
                    var isPath_b_c = spy.calledWith(x.c,   [o, "b", "c"]);
                    assert(isPath_a_c || isPath_b_c, "path o.a.c or o.b.c should be taken");
                    refute(isPath_a_c && isPath_b_c,
                        "EITHER o.a.c OR ELSE o.b.c should be taken, NOT both!");

                    if (isPath_a_c) {
                        assert.calledWith(spy, x.c.d, [o, "a", "c", "d"]);
                    } else { // OR ELSE (but not both)
                        assert.calledWith(spy, x.c.d, [o, "b", "c", "d"]);
                    }

                    // Make sure these were *exactly* the calls (none else).
                    // Let's put this last to not suppress info from failures above.
                    assert.equals(spy.callCount, 4, "cb callCount");
                },

                "in cyclic object": function () {
                    var o = {a: {b: null}};
                    o.a.b = o;
                    var spy = this.makeCb(6); // actually already at 4 but let's go a bit into it
                    forOwnRec(o, spy);

                    assert.calledWith(spy, o.a, [o, "a"]);
                    assert.calledWith(spy, o,   [o, "a", "b"]);

                    // Make sure these were *exactly* the calls (none else).
                    // Let's put this last to not suppress info from failures above.
                    assert.equals(spy.callCount, 2, "cb callCount");
                },

                "in object with isomorphic but non-identical sub-objects": function () {
                    var bottom = { z: "this only once!" };
                    var iso1 = { x: 5, bot: bottom };
                    var iso2 = _.clone(iso1);
                    // it's a shallow copy:
                    assert.equals(iso1, iso2);
                    refute.same(iso1, iso2);
                    assert.same(iso1.bot, iso2.bot); // shallow!
                    var o = { i1: iso1, i2: iso2 };
                    var spy = this.makeCb();
                    forOwnRec(o, spy);

                    assert.calledWith(spy, iso1, [o, "i1"]);
                    assert.calledWith(spy, iso2, [o, "i2"]);
                    assert.calledWith(spy, iso1.x, [o, "i1", "x"]);
                    assert.calledWith(spy, iso2.x, [o, "i2", "x"]);
                    assert.calledWith(spy, bottom, [o, "i1", "bot"]);
                    assert.calledWith(spy, bottom, [o, "i2", "bot"]);

                    // see "in confluent DAG" for a comment
                    var isThru1 = spy.calledWith(bottom.z, [o, "i1", "bot", "z"]);
                    var isThru2 = spy.calledWith(bottom.z, [o, "i2", "bot", "z"]);
                    assert(isThru1 || isThru2,
                        "path o.iso1.bot.z or o.iso2.bot.z should be taken");
                    refute(isThru1 && isThru2,
                        "EITHER o.iso1.bot.z OR ELSE o.iso2.bot.z should be taken, NOT both!");

                    // Make sure these were *exactly* the calls (none else).
                    // Let's put this last to not suppress info from failures above.
                    assert.equals(spy.callCount, 7, "cb callCount");
                }
            }
        }
    });

}(this.util, this.buster, this.lodash));