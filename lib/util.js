((typeof define === "function" && define.amd && function (m) {
    define(["lodash", "buster"], m);
}) || (typeof module === "object" && function (m) {
    module.exports = m(require("lodash"), require("buster"));
}) || function (m) { this.util = m(this._, this.buster); }
)(function (_, buster) {
    "use strict";

    function format(x) {
        // buster.format.ascii is not exactly what we need wrt functions
        // So we'll have to roll our own here :(
        //
        // TODO: buster.format.ascii.functionName does not exist
        //       (it's buster.functionName)

        if (arguments.length === 0) {
            throw new Error("expected at least one arg but got none");
        }

        if (_.isFunction(x) && !_.isRegExp(x)) {
            var fName = buster.functionName(x);
            if (_.isString(fName) && (fName !== "")) {
                return fName;
            }
        }
        return buster.format.ascii(x);
    }

    function formatArgs(arr) {
        var args = _.toArray(arguments);
        if ((args.length !== 1) || !_.isArray(arr)) {
            throw new Error("expected exactly one array argument but got "
                             + formatArgs(args));
        }
        return "(" + arr.map(format).join(", ") + ")";
    }

    function forOwnRecursive(object, callback, thisArg, path, depth) {
        callback = callback || _.identity;
        thisArg = thisArg || this;
        path = path || "";
        depth = depth || 0;
        return _.forOwn(object, function (v, k, o) {
            var path1LevelDeeper = path + "[" + k + "]";
            buster.log(path1LevelDeeper);
            if (depth > 3) {
                throw new Error("debug @" + path1LevelDeeper);
            }
            callback.call(this, v, k, o, path1LevelDeeper);
            // TODO: check return value of callback and stop when _.forOwn would
            // TODO: don't follow circularities
            forOwnRecursive(v, callback, this, path1LevelDeeper, depth + 1);
        }, thisArg);
    }

    return {
        format: format,
        formatArgs: formatArgs,
        forOwnRecursive: forOwnRecursive
    };

});
