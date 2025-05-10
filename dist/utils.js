"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Random = Random;
function Random(len) {
    let Options = "sjasbbscbjcbufbcbkcnzjxcn";
    let length = Options.length;
    let ans = "";
    for (let i = 0; i < len; i++) {
        ans += Options[Math.floor((Math.random() * length))];
    }
    return ans;
}
