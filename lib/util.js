((typeof define === "function" && define.amd && function (m) {
    define(["lodash", "buster"], m);
}) || (typeof module === "object" && function (m) {
    module.exports = m(require("lodash"), require("buster"));
}) || function (m) { this.util = m(this._, this.buster); }
)(function (_, buster) {
    "use strict";

    function fmt(x) {
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

    function fmtArgs() {
        return "(" + _.map(arguments, fmt).join(", ") + ")";
    }

    return {
        fmt: fmt,
        fmtArgs: fmtArgs
    };

});
