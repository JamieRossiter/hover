"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketClosureCodes = void 0;
var SocketClosureCodes;
(function (SocketClosureCodes) {
    SocketClosureCodes[SocketClosureCodes["NORMAL"] = 1000] = "NORMAL";
    SocketClosureCodes[SocketClosureCodes["INVALID_REQUEST"] = 1008] = "INVALID_REQUEST";
    SocketClosureCodes[SocketClosureCodes["OTHER_USER_DISCONNECT"] = 4000] = "OTHER_USER_DISCONNECT";
})(SocketClosureCodes = exports.SocketClosureCodes || (exports.SocketClosureCodes = {}));
