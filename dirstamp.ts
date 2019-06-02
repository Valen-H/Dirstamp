#!/usr/bin/env node
"use strict";

import * as klaw from "klaw";
import * as path from "path";
import * as fs from "fs";
import * as chalk from "chalk";
import { EOL } from "os";
import strip = require("strip-ansi");

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
		watch: boolean;
		nocolors: boolean;  //OBS
	} = {
		json: false,
		check: null,
		watch: false,
		nocolors: false
	};

function ensure(pt: klaw.Item): void {
	pt.path = path.relative(path.resolve(pth), pt.path);

	let pths: string[] = pt.path.split(path.sep).slice(0, -1),
		obj: { } = struct,
		par: { } = struct;

	for (var i of pths) {
		par = obj;
		obj = (obj[i] = obj[i] || { });
	}

	if (i && par[i]) {
		par[i] = (par[i] = par[i] || { });
		par[i][pt.path.split(path.sep).pop()] = pt.stats.isDirectory() ? { } : '';
	} else {
		par[pt.path.split(path.sep).pop()] = pt.stats.isDirectory() ? { } : '';
	}
} //ensure

function breakdown(root: { } = struct, offset: number = 0, key: string): string {
	let tb: string = '\t'.repeat(offset),
		ret: string = EOL;

	if (typeof root === "string") {
		ret += custom.nocolors ? tb + key : chalk["cyan"]["dim"](tb + key);
	} else {
		//@ts-ignore
		ret += custom.nocolors ? tb + key : chalk[strip(key).trim().endsWith("G:") ? "red" : (strip(key).trim().endsWith("S:") ? "green" : "yellow")]["dim"](tb + key);
		for (let i in root) {
			ret += breakdown(root[i], offset + 1, i);
		}
	}

	return ret;
} //breakdown

function checkValidity(struct: { }, base: { } = check, missing: { } = { }): object[] {
	missing = missing || { };

	for (let i in struct) {
		if (typeof struct[i] === "string") {
			if (!(i in base)) {
				missing[i] = struct[i];
			}
			delete base[i];
		} else {
			checkValidity(struct[i], base[i] = base[i] || { }, missing[i] = missing[i] || { });
			if (!Object.keys(base[i]).length) {
				delete base[i];
			}
		}
	}

	return [prune("missing", { missing: missing }), base];
} //checkValidity

function prune(prop: string, targ: {}): { } {
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
	check: {} = {};
	
if (copy.includes("-h")) {
	console.info("Run 'man dirstamp'.");
	process.exit(0);
}

opts.preserveSymlinks = /-.*s/.test(copy.join(' '));
custom.json = /-.*j/.test(copy.join(' '));
(custom.nocolors = /-.*C/.test(copy.join(' '))) && (chalk["level"] = 0);
custom.watch = /-.*w/.test(copy.join(' '));
opts.queueMethod = <klaw.QueueMethod>(/-.*p/.test(copy.join(' ')) ? "pop" : "shift");

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
		console.error(chalk["redBright"](err.message));
		process.exit(err.code);
	}

	copy.splice(idx, 2);
}

/*
 * RESERVED:
 * -p, -s, -j, -C, -c, -w, -d, -h
 */

copy = copy.filter((v: string): boolean => !v.startsWith('-'));

if (custom.watch) {
	fs.watch(pth, {
		persistent: true,
		recursive: true
	}, (evt: string, file: string): void => {
		console.log(chalk["bold"](evt), chalk["underline"](file), chalk["gray"](Date()));
	});
} else {
	klaw(pth = copy.join(' ') || pth, <klaw.Options>opts)
		.on("data", (item: klaw.Item): void => {
			ensure(item);
		}).once("end", (): void => {
			delete struct[''];
			if (custom.check) {
				let out: object[] = checkValidity(struct);
				//@ts-ignore
				process.stdout.write(breakdown(out[0].missing, 0, chalk["underline"]("EXTRANEOUS:") + EOL));
				process.stdout.write(breakdown(out[1], 0, chalk["underline"]("MISSING:") + EOL) + EOL);
			} else if (custom.json) {
				process.stdout.write(JSON.stringify(struct, null, 0));
			} else {
				process.stdout.write(breakdown(struct, 0, path.basename(pth)) + EOL);
			}
		}).once("error", (err: Error): void => {
			console.error(chalk["red"](err.message));
		});
}
