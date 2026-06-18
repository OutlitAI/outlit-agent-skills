#!/usr/bin/env bash
set -euo pipefail

shopt -s nullglob

skill_files=(skills/*/SKILL.md)
if [ "${#skill_files[@]}" -eq 0 ]; then
  echo "ERROR: No skill files found"
  exit 1
fi

python3 - <<'PY'
from pathlib import Path
import re
import sys

errors = []
skill_names = {}

for skill in sorted(Path("skills").glob("*/SKILL.md")):
    text = skill.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines or lines[0] != "---":
        errors.append(f"{skill}: missing opening frontmatter delimiter")
        continue
    try:
        end = lines[1:].index("---") + 1
    except ValueError:
        errors.append(f"{skill}: missing closing frontmatter delimiter")
        continue

    frontmatter = "\n".join(lines[1:end])
    if len(frontmatter.encode("utf-8")) > 1024:
        errors.append(f"{skill}: frontmatter exceeds 1024 bytes")

    name_match = re.search(r"^name:\s*([A-Za-z0-9-]+)\s*$", frontmatter, re.MULTILINE)
    if not name_match:
        errors.append(f"{skill}: name must use letters, numbers, and hyphens only")
    else:
        name = name_match.group(1)
        if name in skill_names:
            errors.append(f"{skill}: duplicate skill name {name!r} also used by {skill_names[name]}")
        skill_names[name] = skill
        if name != skill.parent.name:
            errors.append(f"{skill}: frontmatter name {name!r} must match directory {skill.parent.name!r}")

    desc_match = re.search(r"^description:\s*(.+?)\s*$", frontmatter, re.MULTILINE)
    if not desc_match:
        errors.append(f"{skill}: missing description")
    else:
        desc = desc_match.group(1).strip().strip('"').strip("'")
        if not desc.startswith("Use when "):
            errors.append(f"{skill}: description must start with 'Use when '")
        if len(desc) > 500:
            errors.append(f"{skill}: description should stay under 500 characters")

for md in sorted(Path(".").rglob("*.md")):
    text = md.read_text(encoding="utf-8")
    for match in re.finditer(r"\[[^\]]+\]\(([^)]+)\)", text):
        target = match.group(1).strip()
        if not target or target.startswith(("#", "http://", "https://", "mailto:")):
            continue
        path_part = target.split("#", 1)[0]
        if not path_part:
            continue
        resolved = (md.parent / path_part).resolve()
        try:
            resolved.relative_to(Path.cwd().resolve())
        except ValueError:
            errors.append(f"{md}: link escapes repository: {target}")
            continue
        if not resolved.exists():
            errors.append(f"{md}: broken relative link: {target}")

expected_paths = [
    Path("skills/outlit/references/sql-reference.md"),
    Path("skills/outlit/agents/openai.yaml"),
]
for path in expected_paths:
    if not path.exists():
        errors.append(f"missing required Outlit reference: {path}")

sdk_files = list(Path("skills/outlit-sdk").rglob("*"))
sdk_regular_files = [path for path in sdk_files if path.is_file()]
if sdk_regular_files != [Path("skills/outlit-sdk/SKILL.md")]:
    errors.append(
        "skills/outlit-sdk must remain self-contained as a single SKILL.md; found "
        + ", ".join(str(path) for path in sdk_regular_files)
    )

if errors:
    for error in errors:
        print(f"ERROR: {error}")
    sys.exit(1)

for skill in sorted(Path("skills").glob("*/SKILL.md")):
    print(f"OK: {skill} frontmatter and local references valid")
PY
