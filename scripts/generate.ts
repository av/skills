import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";
import { dirname, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const README_PATH = "./README.md";

async function main() {
  console.log("Reading README.md...");
  const originalReadme = await Deno.readTextFile(README_PATH);
  
  // Split at "### Skills" to preserve the header and everything before it
  const marker = "### Skills";
  const splitIndex = originalReadme.indexOf(marker);
  
  if (splitIndex === -1) {
    console.error(`Could not find "${marker}" section in README.md`);
    Deno.exit(1);
  }

  const baseContent = originalReadme.slice(0, splitIndex + marker.length);

  console.log("Scanning for SKILL.md files...");
  const skills: { name: string; description: string; folder: string }[] = [];

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

  // Build the new Skills section
  let newContent = baseContent + "\n\n";
  
  for (const skill of skills) {
    // Ensure folder path format for markdown link
    const folderPath = skill.folder.startsWith("./") ? skill.folder : `./${skill.folder}`;
    const addSkillCmd = `npx skills add av/skills --skill ${skill.folder}`;
    
    newContent += `#### **[${skill.name}](${folderPath})**\n`;
    newContent += `${skill.description}\n\n`;
    newContent += '```bash\n'
    newContent += `${addSkillCmd}\n`;
    newContent += '```\n';

    // Generate README.md in the skill folder
    const readmeContent = `# ${skill.name}\n\n${skill.description}\n\n\`\`\`bash\n${addSkillCmd}\n\`\`\`\n`;
    await Deno.writeTextFile(join(skill.folder, "README.md"), readmeContent);
  }

  // Write changes back to README
  await Deno.writeTextFile(README_PATH, newContent);
  console.log(`Successfully updated README.md with ${skills.length} skills.`);
}

if (import.meta.main) {
  main();
}
