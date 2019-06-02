#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const klaw = require("klaw");
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const os_1 = require("os");
const strip = require("strip-ansi");
const opts = {
    depthLimit: -1,
    preserveSymlinks: false,
    queueMethod: "shift"
}, custom = {
    json: false,
    check: null,
    watch: false,
    nocolors: false
};
function ensure(pt) {
    pt.path = path.relative(path.resolve(pth), pt.path);
    let pths = pt.path.split(path.sep).slice(0, -1), obj = struct, par = struct;
    for (var i of pths) {
        par = obj;
        obj = (obj[i] = obj[i] || {});
    }
    if (i && par[i]) {
        par[i] = (par[i] = par[i] || {});
        par[i][pt.path.split(path.sep).pop()] = pt.stats.isDirectory() ? {} : '';
    }
    else {
        par[pt.path.split(path.sep).pop()] = pt.stats.isDirectory() ? {} : '';
    }
} //ensure
function breakdown(root = struct, offset = 0, key) {
    let tb = '\t'.repeat(offset), ret = os_1.EOL;
    if (typeof root === "string") {
        ret += custom.nocolors ? tb + key : chalk["cyan"]["dim"](tb + key);
    }
    else {
        //@ts-ignore
        ret += custom.nocolors ? tb + key : chalk[strip(key).trim().endsWith("G:") ? "red" : (strip(key).trim().endsWith("S:") ? "green" : "yellow")]["dim"](tb + key);
        for (let i in root) {
            ret += breakdown(root[i], offset + 1, i);
        }
    }
    return ret;
} //breakdown
function checkValidity(struct, base = check, missing = {}) {
    missing = missing || {};
    for (let i in struct) {
        if (typeof struct[i] === "string") {
            if (!(i in base)) {
                missing[i] = struct[i];
            }
            delete base[i];
        }
        else {
            checkValidity(struct[i], base[i] = base[i] || {}, missing[i] = missing[i] || {});
            if (!Object.keys(base[i]).length) {
                delete base[i];
            }
        }
    }
    return [prune("missing", { missing: missing }), base];
} //checkValidity
function prune(prop, targ) {
    if (!Object.keys(targ[prop]).length && typeof targ[prop] !== "string") {
        delete targ[prop];
    }
    else if (typeof targ[prop] !== "string") {
        for (let i in targ[prop]) {
            prune(i, targ[prop]);
        }
    }
    return targ;
} //prune
let copy = Array.from(process.argv.slice(2)), struct = {}, pth = process.cwd(), check = {};
if (copy.includes("-h")) {
    console.info("Run 'man dirstamp'.");
    process.exit(0);
}
opts.preserveSymlinks = /-.*s/.test(copy.join(' '));
custom.json = /-.*j/.test(copy.join(' '));
(custom.nocolors = /-.*C/.test(copy.join(' '))) && (chalk["level"] = 0);
custom.watch = /-.*w/.test(copy.join(' '));
opts.queueMethod = (/-.*p/.test(copy.join(' ')) ? "pop" : "shift");
if (copy.includes("-d")) {
    let idx;
    opts.depthLimit = Number.parseInt(copy[(idx = copy.findIndex((val) => val === "-d")) + 1]);
    if (isNaN(opts.depthLimit)) {
        console.error(chalk["italic"]("INVALID DEPTH!\t-d"), chalk["red"](copy[idx + 1]));
        process.exit(1);
    }
    copy.splice(idx, 2);
}
if (copy.includes("-c")) {
    let idx;
    custom.check = path.normalize(copy[(idx = copy.findIndex((val) => val === "-c")) + 1]);
    try {
        check = JSON.parse(fs.readFileSync(custom.check, "utf8"));
    }
    catch (err) {
        console.error(chalk["redBright"](err.message));
        process.exit(err.code);
    }
    copy.splice(idx, 2);
}
/*
 * RESERVED:
 * -p, -s, -j, -C, -c, -w, -d, -h
 */
copy = copy.filter((v) => !v.startsWith('-'));
if (custom.watch) {
    fs.watch(pth, {
        persistent: true,
        recursive: true
    }, (evt, file) => {
        console.log(chalk["bold"](evt), chalk["underline"](file), chalk["gray"](Date()));
    });
}
else {
    klaw(pth = copy.join(' ') || pth, opts)
        .on("data", (item) => {
        ensure(item);
    }).once("end", () => {
        delete struct[''];
        if (custom.check) {
            let out = checkValidity(struct);
            //@ts-ignore
            process.stdout.write(breakdown(out[0].missing, 0, chalk["underline"]("EXTRANEOUS:") + os_1.EOL));
            process.stdout.write(breakdown(out[1], 0, chalk["underline"]("MISSING:") + os_1.EOL) + os_1.EOL);
        }
        else if (custom.json) {
            process.stdout.write(JSON.stringify(struct, null, 0));
        }
        else {
            process.stdout.write(breakdown(struct, 0, path.basename(pth)) + os_1.EOL);
        }
    }).once("error", (err) => {
        console.error(chalk["red"](err.message));
    });
}
//# sourceMappingURL=dirstamp.js.map