#!/usr/bin/env python3
"""
Detects project characteristics to guide Outlit SDK installation.

This script analyzes a project directory to determine:
- Framework type (React, Next.js, Vue, Node.js, etc.)
- Package manager (npm, yarn, pnpm, bun)
- Language (TypeScript vs JavaScript)
- Build configuration
- Existing auth provider (if detectable)

Usage:
    python detect_project.py [project_path]
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional


def detect_package_manager(project_path: Path) -> str:
    """Detect which package manager is used."""
    if (project_path / "pnpm-lock.yaml").exists():
        return "pnpm"
    elif (project_path / "yarn.lock").exists():
        return "yarn"
    elif (project_path / "bun.lockb").exists():
        return "bun"
    elif (project_path / "package-lock.json").exists():
        return "npm"
    elif (project_path / "package.json").exists():
        return "npm"  # default if package.json exists
    return "unknown"


def read_package_json(project_path: Path) -> Optional[Dict]:
    """Read and parse package.json if it exists."""
    package_json_path = project_path / "package.json"
    if not package_json_path.exists():
        return None

    try:
        with open(package_json_path, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return None


def detect_framework(project_path: Path, package_json: Optional[Dict]) -> str:
    """Detect the framework being used."""
    if not package_json:
        return "unknown"

    deps = {**package_json.get("dependencies", {}), **package_json.get("devDependencies", {})}

    # Check for specific frameworks (order matters - Next.js includes React)
    if "next" in deps:
        return "nextjs"
    elif "react" in deps or "react-dom" in deps:
        # Check for Create React App
        if "react-scripts" in deps:
            return "react-cra"
        # Check for Vite
        elif "vite" in deps:
            return "react-vite"
        return "react"
    elif "vue" in deps:
        if "nuxt" in deps:
            return "nuxt"
        return "vue"
    elif "svelte" in deps:
        if "@sveltejs/kit" in deps:
            return "sveltekit"
        return "svelte"
    elif "@angular/core" in deps:
        return "angular"
    elif "astro" in deps:
        return "astro"
    elif "express" in deps:
        return "express"
    elif "fastify" in deps:
        return "fastify"
    elif "@nestjs/core" in deps:
        return "nestjs"

    # Check for Node.js backend
    if package_json.get("type") == "module" or any(k.startswith("@types/node") for k in deps):
        return "nodejs"

    return "unknown"


def detect_typescript(project_path: Path, package_json: Optional[Dict]) -> bool:
    """Detect if the project uses TypeScript."""
    # Check for tsconfig.json
    if (project_path / "tsconfig.json").exists():
        return True

    # Check for TypeScript in dependencies
    if package_json:
        deps = {**package_json.get("dependencies", {}), **package_json.get("devDependencies", {})}
        if "typescript" in deps:
            return True

    # Check for .ts or .tsx files
    for ext in ["ts", "tsx"]:
        if list(project_path.rglob(f"*.{ext}")):
            return True

    return False


def detect_auth_provider(package_json: Optional[Dict]) -> Optional[str]:
    """Detect if a common auth provider is used."""
    if not package_json:
        return None

    deps = {**package_json.get("dependencies", {}), **package_json.get("devDependencies", {})}

    auth_providers = {
        "@clerk/nextjs": "clerk",
        "@clerk/clerk-react": "clerk",
        "next-auth": "nextauth",
        "@auth/nextjs": "authjs",
        "@supabase/auth-helpers-react": "supabase",
        "@supabase/supabase-js": "supabase",
        "@auth0/nextjs-auth0": "auth0",
        "auth0-js": "auth0",
    }

    for dep, provider in auth_providers.items():
        if dep in deps:
            return provider

    return None


def detect_outlit_package(package_json: Optional[Dict]) -> Optional[str]:
    """Check if Outlit SDK is already installed."""
    if not package_json:
        return None

    deps = {**package_json.get("dependencies", {}), **package_json.get("devDependencies", {})}

    if "@outlit/browser" in deps:
        return "@outlit/browser"
    elif "@outlit/node" in deps:
        return "@outlit/node"
    elif "@outlit/core" in deps:
        return "@outlit/core"

    return None


def recommend_package(framework: str) -> str:
    """Recommend which Outlit package to install based on framework."""
    browser_frameworks = ["react", "react-cra", "react-vite", "nextjs", "vue", "nuxt",
                          "svelte", "sveltekit", "angular", "astro"]

    if framework in browser_frameworks:
        return "@outlit/browser"
    elif framework in ["nodejs", "express", "fastify", "nestjs"]:
        return "@outlit/node"
    else:
        return "@outlit/browser"  # default to browser for unknown


def main():
    # Get project path from args or use current directory
    project_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()

    if not project_path.exists():
        print(json.dumps({"error": f"Path does not exist: {project_path}"}))
        sys.exit(1)

    # Run detection
    package_json = read_package_json(project_path)
    package_manager = detect_package_manager(project_path)
    framework = detect_framework(project_path, package_json)
    is_typescript = detect_typescript(project_path, package_json)
    auth_provider = detect_auth_provider(package_json)
    existing_outlit = detect_outlit_package(package_json)
    recommended_package = recommend_package(framework)

    # Build result
    result = {
        "project_path": str(project_path.absolute()),
        "package_manager": package_manager,
        "framework": framework,
        "typescript": is_typescript,
        "auth_provider": auth_provider,
        "existing_outlit_package": existing_outlit,
        "recommended_package": recommended_package,
    }

    # Output as JSON
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
