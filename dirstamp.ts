#!/usr/bin/env node
"use strict";

import * as klaw from "klaw";
import * as path from "path";
import { inspect } from "util";
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
	isFalse: RegExp = /^(no?|false)$/i,
	custom: {
		json: boolean
	} = {
		json: false
	};

function remove(arr: string[], rem: string): string[] | void {
	let idx: number = arr.findIndex((v: string) => v === rem);
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
		par[i] = (par[i] instanceof Array) ? par[i] : [ ];
		par[i].push(pth.split(path.sep).pop());
	}
} //ensure

function breakdown(root: {} | string[] = struct, offset: number = 0, key: string): string {
	let tb: string = "\t".repeat(offset),
		ret: string = tb + key + EOL;

	tb += '\t';

	if (root instanceof Array) {
		for (let i of root) {
			ret += tb + i + EOL;
		}
	} else {
		for (let i in root) {
			ret += breakdown(root[i], offset + 1, i);
		}
	}
	return ret;
} //breakdown

let copy: string[] = Array.from(process.argv.slice(2)),
	struct: {} = {},
	pth: string = process.cwd();

opts.preserveSymlinks = copy.includes("-p");
custom.json = copy.includes("-j");
opts.queueMethod = <klaw.QueueMethod>(copy.includes("-P") ? "pop" : "shift");
if (copy.includes("-d")) {
	let idx: number;
	opts.depthLimit = Number.parseInt(copy[(idx = copy.findIndex((val: string) => val === "-d")) + 1]);
	if (isNaN(opts.depthLimit)) {
		console.error("INVALID DEPTH!\t-d", copy[idx + 1]);
	}
	copy.splice(idx, 2);
}

remove(copy, "-p");
remove(copy, "-P");
remove(copy, "-j");

klaw(pth = path.normalize(copy.pop() || pth), <klaw.Options>opts)
	.on("data", (item: klaw.Item) => {
		ensure(path.relative(path.normalize(pth), item.path));
	}).once("end", () => {
		if (custom.json) {
			process.stdout.write(inspect(struct, {
				compact: true,
				depth: Infinity,
				breakLength: Infinity
			}).replace(/(\B) (\B)?/gmi, "$1$2"));
		} else {
			process.stdout.write(breakdown(struct, 0, path.normalize(pth)));
		}
	}).once("error", (err: Error, item: klaw.Item) => {
		console.error(item.path, EOL, err.message);
	});
