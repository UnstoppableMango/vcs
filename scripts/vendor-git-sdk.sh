#!/usr/bin/env bash
# `@unmango/pulumi-git` isn't published to npm, so the nix-built SDK is placed
# into node_modules by hand. Copied, not symlinked: the SDK declares
# @pulumi/pulumi as a dependency but doesn't ship it, and node and bun both
# resolve from a symlink's realpath, so a symlinked SDK would search upward from
# /nix/store and never find our copy.
#
# GIT_SDK_NODEJS is the nix-built nodejs SDK package.
set -euo pipefail

rm -rf node_modules/@unmango/pulumi-git
mkdir -p node_modules/@unmango
cp -rL --no-preserve=mode,ownership \
  "$GIT_SDK_NODEJS/lib/node_modules/@unmango/pulumi-git" \
  node_modules/@unmango/pulumi-git
