import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";
import { dirname, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const README_PATH = "./README.md";
const CATEGORIES_PATH = "./scripts/categories.json";
const REPO = "av/skills";
const LOGO_DIR = "assets/logos";

/** Skills without a hand-authored logo simply render without one. */
async function hasLogo(name: string): Promise<boolean> {
  try {
    await Deno.stat(`./${LOGO_DIR}/${name}.svg`);
    return true;
  } catch {
    return false;
  }
}

type Skill = { name: string; description: string; folder: string };

/** First sentence of a description, capped, for the overview table. */
function summarize(description: string, max = 190): string {
  const flat = description.replace(/\s+/g, " ").trim();
  const firstSentence = flat.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? flat;
  const summary = firstSentence.length > max
    ? firstSentence.slice(0, max - 1).replace(/\s+\S*$/, "") + "…"
    : firstSentence;
  return summary;
}

function installCmd(folder: string): string {
  return `npx skills add ${REPO} --skill ${folder}`;
}

async function main() {
  console.log("Reading README.md...");
  const originalReadme = await Deno.readTextFile(README_PATH);

  // Split at "### Skills" to preserve the header and everything before it
  const marker = "## Skills";
  const splitIndex = originalReadme.indexOf(marker);

  if (splitIndex === -1) {
    console.error(`Could not find "${marker}" section in README.md`);
    Deno.exit(1);
  }

  const baseContent = originalReadme.slice(0, splitIndex + marker.length);

  const categories: Record<string, string[]> = JSON.parse(
    await Deno.readTextFile(CATEGORIES_PATH),
  );

  console.log("Scanning for SKILL.md files...");
  const skills: Skill[] = [];

  // Walk excluding hidden folders and node_modules
  for await (const entry of walk(".", {
    match: [/SKILL\.md$/],
    skip: [/\.git/, /node_modules/],
    maxDepth: 3
  })) {
    const content = await Deno.readTextFile(entry.path);

    // Parse frontmatter
    const nameMatch = content.match(/^name:\s*(.+)$/m);
    // Supports both `description: text` and YAML folded/literal block scalars
    // (`description: >` / `description: |` followed by an indented block).
    const descMatch = content.match(/^description:[ \t]*([>|][-+]?)?[ \t]*(.*)$/m);
    let description = "";
    if (descMatch) {
      if (descMatch[1]) {
        const rest = content.slice(content.indexOf(descMatch[0]) + descMatch[0].length);
        const lines: string[] = [];
        for (const line of rest.split("\n").slice(1)) {
          if (line.trim() === "") { lines.push(""); continue; }
          if (!/^[ \t]/.test(line)) break;
          lines.push(line.trim());
        }
        const joiner = descMatch[1].startsWith("|") ? "\n" : " ";
        description = lines.join(joiner).trim();
      } else {
        description = descMatch[2].trim();
      }
    }

    if (nameMatch && description) {
      skills.push({
        name: nameMatch[1].trim(),
        description,
        folder: dirname(entry.path),
      });
    }
  }

  // Sort alphabetically by name
  skills.sort((a, b) => a.name.localeCompare(b.name));

  const byName = new Map(skills.map((s) => [s.name, s]));
  const categorized = new Set(
    Object.values(categories).flat().filter((n) => byName.has(n)),
  );
  const uncategorized = skills.filter((s) => !categorized.has(s.name));

  // Build the new Skills section: one table per category
  let newContent = baseContent + "\n\n";
  newContent += `${skills.length} skills. Install any of them with ` +
    `\`npx skills add ${REPO} --skill <name>\`.\n\n`;

  const groups: [string, Skill[]][] = Object.entries(categories)
    .filter(([category]) => !category.startsWith("_"))
    .map(([category, names]) => [
      category,
      names.map((n) => byName.get(n)).filter((s): s is Skill => !!s),
    ]);
  if (uncategorized.length) groups.push(["Other", uncategorized]);

  for (const [category, members] of groups) {
    if (!members.length) continue;
    newContent += `### ${category}\n\n`;
    for (const skill of members) {
      const folderPath = skill.folder.startsWith("./") ? skill.folder : `./${skill.folder}`;
      // The logo stands in for a list marker, so these are blank-line separated
      // paragraphs rather than a bulleted list.
      const logo = await hasLogo(skill.name)
        ? `<img src="./${LOGO_DIR}/${skill.name}.svg" width="26" align="top" alt="">&nbsp;`
        : "";
      newContent += `${logo}**[${skill.name}](${folderPath})** — ` +
        `${summarize(skill.description)}\n\n`;
    }
    newContent += "\n\n";
  }

  // Generate README.md in each skill folder — the full, model-facing description
  for (const skill of skills) {
    const logoHeader = await hasLogo(skill.name)
      ? `<img src="../${LOGO_DIR}/${skill.name}.svg" width="72" align="left" hspace="12" alt="">\n\n`
      : "";
    const readmeContent = `${logoHeader}# ${skill.name}\n\n${skill.description}\n\n` +
      `\`\`\`bash\n${installCmd(skill.folder)}\n\`\`\`\n\n` +
      `Part of [${REPO}](https://github.com/${REPO}) — a library of agent skills ` +
      `for Claude Code, Codex, OpenCode and other coding agents.\n`;
    await Deno.writeTextFile(join(skill.folder, "README.md"), readmeContent);
  }

  // Write changes back to README (no trailing blank lines at EOF)
  await Deno.writeTextFile(README_PATH, newContent.trimEnd() + "\n");
  console.log(`Successfully updated README.md with ${skills.length} skills.`);
}

if (import.meta.main) {
  main();
}
