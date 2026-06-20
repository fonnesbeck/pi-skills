import * as fs from "node:fs";
import { basename } from "node:path";
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent/extensibility/extensions/types";

// shellQuote escapes for the outer shell (bash), which receives the quoted
// string, strips the outer single quotes, and passes the literal command to
// `nu -c`. Nushell then parses the command using its own syntax rules.
function shellQuote(value: string) {
	return `'${value.replaceAll("'", `'\\''`)}'`;
}

function getNuPath() {
	if (process.env.PI_USER_NU_SHELL) return process.env.PI_USER_NU_SHELL;
	if (process.env.SHELL && basename(process.env.SHELL) === "nu") {
		return process.env.SHELL;
	}
	return "nu";
}

function isExecutableAvailable(path: string): boolean {
	if (path.includes("/")) {
		return fs.existsSync(path);
	}
	// Bare command name — let the shell resolve it via PATH at exec time
	return true;
}

function countLines(output: string): number {
	return output.length === 0 ? 0 : output.split(/\r\n|\r|\n/).length;
}

function toBashResult(output: string, exitCode: number | undefined, cancelled: boolean) {
	const totalBytes = Buffer.byteLength(output);
	const totalLines = countLines(output);
	return {
		output,
		exitCode,
		cancelled,
		truncated: false,
		totalLines,
		totalBytes,
		outputLines: totalLines,
		outputBytes: totalBytes,
	};
}

export default function (pi: ExtensionAPI) {
	const nuPath = getNuPath();
	if (!isExecutableAvailable(nuPath)) {
		console.warn(`[nu-user-bash] Nushell not found at "${nuPath}". Integration disabled.`);
		return;
	}

	pi.on("user_bash", async (event) => {
		const nuCommand = `exec ${shellQuote(nuPath)} -c ${shellQuote(event.command)}`;
		const result = await pi.exec("bash", ["-lc", nuCommand], { cwd: event.cwd });
		const output = result.stderr ? `${result.stdout}${result.stderr}` : result.stdout;
		return { result: toBashResult(output, result.code, result.killed) };
	});
}
