import * as fs from "node:fs";
import * as path from "node:path";
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent/extensibility/extensions/types";

// Track files modified during the current agent run and across the session
const currentRunModifications = new Set<string>();
const sessionModifications = new Set<string>();
let isNextTurnSimplification = false;
let autoSimplify = false;
let isSimplificationTurn = false;

function getSkillContent(): string {
	const skillPath = path.join(__dirname, "..", "skills", "code-simplifier", "SKILL.md");
	try {
		return fs.readFileSync(skillPath, "utf-8");
	} catch {
		console.warn(`[code-simplifier] Skill file not found at: ${skillPath}`);
		return "";
	}
}

function extractPathFromToolInput(toolName: string, input: Record<string, unknown>): string | undefined {
	if (toolName === "edit" || toolName === "write") {
		return (input.path as string) || (input.file_path as string);
	}
	return undefined;
}

function getSimplificationSystemPrompt(): string {
	const skillContent = getSkillContent();
	if (!skillContent) return "";
	// Strip frontmatter and return the instruction body
	return skillContent.replace(/^---[\s\S]*?---\s*/, "").trim();
}

export default function (pi: ExtensionAPI) {
	// Reset per-run tracking at the start of each user prompt
	pi.on("agent_start", (_event, _ctx) => {
		currentRunModifications.clear();
	});

	// Track file modifications via tool results
	pi.on("tool_result", (event, _ctx) => {
		if (event.toolName === "edit" || event.toolName === "write") {
			const filePath = extractPathFromToolInput(event.toolName, event.input);
			if (filePath) {
				currentRunModifications.add(filePath);
				sessionModifications.add(filePath);
			}
		}
	});

	// Auto-trigger simplification after the agent finishes its work
	pi.on("agent_end", (_event, _ctx) => {
		// Prevent infinite loops: don't auto-trigger on simplification turns
		if (isSimplificationTurn) {
			isSimplificationTurn = false;
			return;
		}

		if (autoSimplify && currentRunModifications.size > 0) {
			const files = Array.from(currentRunModifications).join(", ");
			currentRunModifications.clear();

			const promptText =
				`Please review and simplify the recently modified code for clarity, consistency, and maintainability while preserving all functionality.\n\n` +
				`Recently modified files: ${files}`;

			isNextTurnSimplification = true;
			pi.sendUserMessage(promptText, { deliverAs: "followUp" });
		}
	});

	// Inject simplification instructions into the system prompt for simplification turns
	pi.on("before_agent_start", (event, _ctx) => {
		if (isNextTurnSimplification) {
			isNextTurnSimplification = false;
			isSimplificationTurn = true;
			const instructions = getSimplificationSystemPrompt();
			if (instructions) {
				return {
					systemPrompt: [...event.systemPrompt, instructions],
				};
			}
		}
	});

	// Manual command: /simplify — run simplification on tracked files
	pi.registerCommand("simplify", {
		description: "Simplify recently modified code",
		handler: async (_args, ctx) => {
			const files =
				sessionModifications.size > 0 ? sessionModifications : currentRunModifications;

			if (files.size === 0) {
				ctx.ui.notify("No recently modified files to simplify.", "warning");
				return;
			}

			const fileList = Array.from(files).join(", ");
			sessionModifications.clear();
			currentRunModifications.clear();

			const promptText =
				`Please review and simplify the recently modified code for clarity, consistency, and maintainability while preserving all functionality.\n\n` +
				`Recently modified files: ${fileList}`;

			isNextTurnSimplification = true;
			pi.sendUserMessage(promptText);
		},
	});

	// Toggle auto-simplify: /simplify-auto on|off|status
	pi.registerCommand("simplify-auto", {
		description: "Toggle automatic code simplification after edits (on/off/status)",
		handler: async (args, ctx) => {
			const arg = args.trim().toLowerCase();
			if (arg === "on") {
				autoSimplify = true;
				ctx.ui.notify("Auto-simplify enabled.", "info");
			} else if (arg === "off") {
				autoSimplify = false;
				ctx.ui.notify("Auto-simplify disabled.", "info");
			} else {
				ctx.ui.notify(
					`Auto-simplify is ${autoSimplify ? "enabled" : "disabled"}. Usage: /simplify-auto on|off`,
					"info",
				);
			}
		},
	});

	// Show tracked files: /simplify-status
	pi.registerCommand("simplify-status", {
		description: "Show files tracked for simplification",
		handler: async (_args, ctx) => {
			const allFiles = new Set([...sessionModifications, ...currentRunModifications]);
			if (allFiles.size === 0) {
				const message = "No files currently tracked for simplification.";
				console.log(message);
				ctx.ui.notify(message, "info");
			} else {
				const message = `Tracked files:\n${Array.from(allFiles).join("\n")}`;
				console.log(message);
				ctx.ui.notify(message, "info");
			}
		},
	});
}
