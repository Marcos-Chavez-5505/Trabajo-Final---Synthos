import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "components", "ui-rnr");

const SPEC = {
	Dialog: {
		index: "Dialog/index.js",
		source: "Dialog/Dialog.jsx",
		exports: [
			"Dialog",
			"DialogTrigger",
			"DialogPortal",
			"DialogClose",
			"DialogOverlay",
			"DialogContent",
			"DialogHeader",
			"DialogFooter",
			"DialogTitle",
			"DialogDescription",
		],
	},
	AlertDialog: {
		index: "AlertDialog/index.js",
		source: "AlertDialog/AlertDialog.jsx",
		exports: [
			"AlertDialog",
			"AlertDialogTrigger",
			"AlertDialogPortal",
			"AlertDialogOverlay",
			"AlertDialogContent",
			"AlertDialogHeader",
			"AlertDialogFooter",
			"AlertDialogMedia",
			"AlertDialogTitle",
			"AlertDialogDescription",
			"AlertDialogAction",
			"AlertDialogCancel",
		],
	},
	NativeOnlyAnimatedView: {
		index: "NativeOnlyAnimatedView/index.js",
		source: "NativeOnlyAnimatedView/NativeOnlyAnimatedView.jsx",
		exports: ["NativeOnlyAnimatedView"],
	},
};

function read(relativePath) {
	return readFileSync(resolve(root, relativePath), "utf8");
}

function exportedNames(indexSource) {
	const names = new Set();
	const blocks = indexSource.matchAll(/export\s*\{([\s\S]*?)\}\s*from\s*["'][^"']+["']/g);
	for (const block of blocks) {
		for (const raw of block[1].split(",")) {
			const entry = raw.trim();
			if (!entry) continue;
			const [local, alias] = entry.split(/\s+as\s+/);
			names.add((alias ?? local).trim());
		}
	}
	return names;
}

function declaredNames(source) {
	const names = new Set();
	const patterns = [
		/function\s+([A-Za-z0-9_$]+)\s*\(/g,
		/(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=/g,
		/class\s+([A-Za-z0-9_$]+)/g,
	];
	for (const pattern of patterns) {
		for (const match of source.matchAll(pattern)) {
			names.add(match[1]);
		}
	}
	return names;
}

let failures = 0;
const lines = [];

for (const [component, spec] of Object.entries(SPEC)) {
	let indexSource;
	let sourceSource;
	try {
		indexSource = read(spec.index);
		sourceSource = read(spec.source);
	} catch (error) {
		failures += 1;
		lines.push(`FAIL ${component}: no se pudo leer ${error.path ?? "el archivo"}`);
		continue;
	}

	const fromIndex = exportedNames(indexSource);
	const declared = declaredNames(sourceSource);

	for (const name of spec.exports) {
		if (!fromIndex.has(name)) {
			failures += 1;
			lines.push(`FAIL ${component}: "${name}" no está exportado en ${spec.index}`);
			continue;
		}
		if (!declared.has(name)) {
			failures += 1;
			lines.push(
				`FAIL ${component}: "${name}" se exporta pero no está declarado en ${spec.source}`,
			);
			continue;
		}
		lines.push(`OK   ${component}.${name}`);
	}

	for (const name of fromIndex) {
		if (!spec.exports.includes(name)) {
			lines.push(`WARN ${component}: "${name}" se exporta y no está en la especificación`);
		}
	}
}

lines.push("");
lines.push(
	"Chequeo estático (no ejecuta los módulos: JSX + react-native). No prueba comportamiento.",
);
lines.push(failures === 0 ? "RESULTADO: OK" : `RESULTADO: ${failures} falla(s)`);

process.stdout.write(`${lines.join("\n")}\n`);
process.exit(failures === 0 ? 0 : 1);