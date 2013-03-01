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

    function forOwnRec(object, callback, thisArg) {
        var cb = (callback || _.identity).bind(thisArg || this);
        var seen = []; // TODO: ++perf, eg hashing
        function doIt(currentObj, path) {
            if (_.isObject(currentObj) && !_.contains(seen, currentObj)) {
                seen.push(currentObj);
                _.forOwn(currentObj, function (v, k, o) {
                //_(currentObj).keys().sortBy().forEach(function (k, i, keys) {
                //    var v = currentObj[k];
                    var nextPath = path.concat(k);
                    cb(v, nextPath);
                    // TODO: check return value of callback and stop when _.forOwn would
                    doIt(v, nextPath);
                }, thisArg);
            }
        }
        doIt(object, [object]);
        return object;
    }

    return {
        format: format,
        formatArgs: formatArgs,
        forOwnRec: forOwnRec
    };

});
