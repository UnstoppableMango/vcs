#!/usr/bin/env bash
# A plugin on PATH is version-blind: pulumi runs whichever binary it finds and
# never checks it against the version the SDK asks for, so a bump to either lock
# that the other hasn't followed would silently run a provider the SDK wasn't
# built against. Compare the two pins directly instead.
#
# The PATH plugin versions come from the environment: GITHUB_PLUGIN_VERSION,
# GITLAB_PLUGIN_VERSION, and GIT_PLUGIN_VERSION.
set -euo pipefail

status=0

check() {
  local plugin=$1 dir=$2 pinned=$3 manifest sdk

  manifest="$dir/package.json"
  if [ ! -f "$manifest" ]; then
    echo "$plugin: no SDK at $dir"
    case "$plugin" in
      git) echo "  the vendored copy is missing. Run \`vendor-git-sdk\`." ;;
      *)   echo "  the dependency isn't installed. Run \`bun install\`." ;;
    esac
    status=1
    return
  fi

  sdk=$(jq -r '.pulumi.version // .version' "$manifest")
  if [ "$sdk" != "$pinned" ]; then
    echo "$plugin: SDK $sdk != PATH plugin $pinned"
    case "$plugin" in
      git) echo "  the vendored SDK is stale. Run \`vendor-git-sdk\`." ;;
      *)   echo "  the two pins have drifted. Run \`bun add @pulumi/$plugin@$pinned\` to follow the plugin, or \`nix flake update pulumipkgs\` to follow the SDK." ;;
    esac
    status=1
  fi
}

check github node_modules/@pulumi/github "$GITHUB_PLUGIN_VERSION"
check gitlab node_modules/@pulumi/gitlab "$GITLAB_PLUGIN_VERSION"
check git node_modules/@unmango/pulumi-git "$GIT_PLUGIN_VERSION"

exit "$status"
