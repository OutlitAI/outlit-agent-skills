#!/usr/bin/env bash
#
# Installs the Outlit SDK using the detected package manager
#
# Usage:
#   ./install_sdk.sh <package-name> [package-manager]
#
# Arguments:
#   package-name: The Outlit package to install (@outlit/browser, @outlit/node, @outlit/core)
#   package-manager: Optional. Package manager to use (npm, yarn, pnpm, bun). Auto-detects if not provided.
#
# Examples:
#   ./install_sdk.sh @outlit/browser
#   ./install_sdk.sh @outlit/node pnpm
#

set -e

PACKAGE_NAME="${1}"
PACKAGE_MANAGER="${2:-}"

if [ -z "$PACKAGE_NAME" ]; then
    echo "Error: Package name is required"
    echo "Usage: $0 <package-name> [package-manager]"
    exit 1
fi

# Auto-detect package manager if not provided
if [ -z "$PACKAGE_MANAGER" ]; then
    if [ -f "pnpm-lock.yaml" ]; then
        PACKAGE_MANAGER="pnpm"
    elif [ -f "yarn.lock" ]; then
        PACKAGE_MANAGER="yarn"
    elif [ -f "bun.lockb" ]; then
        PACKAGE_MANAGER="bun"
    elif [ -f "package-lock.json" ] || [ -f "package.json" ]; then
        PACKAGE_MANAGER="npm"
    else
        echo "Error: Could not detect package manager. Please specify one."
        exit 1
    fi
fi

echo "Installing $PACKAGE_NAME using $PACKAGE_MANAGER..."

case "$PACKAGE_MANAGER" in
    npm)
        npm install "$PACKAGE_NAME"
        ;;
    yarn)
        yarn add "$PACKAGE_NAME"
        ;;
    pnpm)
        pnpm add "$PACKAGE_NAME"
        ;;
    bun)
        bun add "$PACKAGE_NAME"
        ;;
    *)
        echo "Error: Unsupported package manager: $PACKAGE_MANAGER"
        exit 1
        ;;
esac

echo "✓ Successfully installed $PACKAGE_NAME"
