#!/usr/bin/env node
"use strict";

import * as klaw from "klaw";
import * as path from "path";
import * as fs from "fs";
import * as chalk from "chalk";
import { EOL } from "os";

const opts: {
	depthLimit: number,
	preserveSymlinks: boolean,
	queueMethod: klaw.QueueMethod
} = {
	depthLimit: -1,
	preserveSymlinks: false,
	queueMethod: "shift"
},
	custom: {
		json: boolean;
		check: string;
	} = {
		json: false,
		check: null
	};

function remove(arr: string[], rem: string): string[] | void {
	let idx: number = arr.findIndex((v: string): boolean => v === rem);
	if (idx < 0) return;
	return arr.splice(idx, 1);
} //remove

function ensure(pth: string): void {
	let pths: string[] = pth.split(path.sep).slice(0, -1);
	let obj: {} = struct,
		par: {} = struct;
	for (var i of pths) {
		par = obj;
		obj = (obj[i] = obj[i] || { });
	}
	if (i) {
		par[i] = (par[i] = par[i] || { });
		par[i][pth.split(path.sep).pop()] = '';
	} else {
		par[pth.split(path.sep).pop()] = '';
	}
} //ensure

function breakdown(root: {} | string[] = struct, offset: number = 0, key: string): string {
	let tb: string = "\t".repeat(offset),
		ret: string = EOL + tb + key;

	tb += '\t';

	if (typeof root === "string") {
		ret += tb + root;
	} else {
		for (let i in root) {
			ret += breakdown(root[i], offset + 1, i);
		}
	}
	return ret;
} //breakdown

function checkValidity(struct: {}, base: {} = check, missing: {} = { }): object[] {
	missing = missing || { };

	for (let i in struct) {
		if (typeof struct[i] === "string") {
			if (!(i in base)) {
				missing[i] = '';
			}
			delete base[i];
		} else {
			checkValidity(struct[i], base[i] = base[i] || {}, missing[i] = missing[i] || {});
			if (!Object.keys(base[i]).length) {
				delete base[i];
			}
		}
	}

	return [prune("missing", { missing: missing }), base];
} //checkValidity

function prune(prop: string, targ: {}): {} {
	if (!Object.keys(targ[prop]).length && typeof targ[prop] !== "string") {
		delete targ[prop];
	} else if (typeof targ[prop] !== "string") {
		for (let i in targ[prop]) {
			prune(i, targ[prop]);
		}
	}

	return targ;
} //prune

let copy: string[] = Array.from(process.argv.slice(2)),
	struct: {} = { },
	pth: string = process.cwd(),
	check: {} = { };

opts.preserveSymlinks = copy.includes("-s");
custom.json = copy.includes("-j");
opts.queueMethod = <klaw.QueueMethod>(copy.includes("-p") ? "pop" : "shift");
if (copy.includes("-d")) {
	let idx: number;
	opts.depthLimit = Number.parseInt(copy[(idx = copy.findIndex((val: string): boolean => val === "-d")) + 1]);
	if (isNaN(opts.depthLimit)) {
		console.error(chalk["italic"]("INVALID DEPTH!\t-d"), chalk["red"](copy[idx + 1]));
		process.exit(1);
	}
	copy.splice(idx, 2);
}
if (copy.includes("-c")) {
	let idx: number;
	custom.check = path.normalize(copy[(idx = copy.findIndex((val: string): boolean => val === "-c")) + 1]);
	try {
		check = JSON.parse(fs.readFileSync(custom.check, "utf8"));
	} catch (err) {
		console.error(chalk["red"](err.message));
		process.exit(err.code);
	}
	copy.splice(idx, 2);
}

remove(copy, "-p");
remove(copy, "-s");
remove(copy, "-j");

klaw(pth = path.normalize(copy.join(' ') || pth), <klaw.Options>opts)
	.on("data", (item: klaw.Item) => {
		ensure(path.relative(path.normalize(pth), item.path));
	}).once("end", () => {
		if (custom.check) {
			let out: object[] = checkValidity(struct);
			//@ts-ignore
			process.stdout.write(chalk["green"](breakdown(out[0].missing, 0, chalk["underline"]("EXTRANEOUS:") + EOL)));
			process.stdout.write(chalk["red"](breakdown(out[1], 0, chalk["underline"]("MISSING:") + EOL)) + EOL);
		} else if (custom.json) {
			process.stdout.write(JSON.stringify(struct, null, 0));
		} else {
			process.stdout.write(breakdown(struct, 0, path.basename(pth)));
		}
	}).once("error", (err: Error) => {
		console.error(chalk["red"](err.message));
	});
