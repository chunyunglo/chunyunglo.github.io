#!/bin/sh
# Builds the native "網站編輯器.app" for this repository and installs it into ~/Applications.
# Needs the Xcode command line tools (xcode-select --install).
# Usage: sh tools/macos/build-app.sh
set -e
cd "$(dirname "$0")/../.."
REPO="${REPO:-$(pwd)}"
NAME="網站編輯器"
DEST="${DEST:-$HOME/Applications/$NAME.app}"
TMP="$(mktemp -d)"
APP="$TMP/$NAME.app"

mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
swiftc -O -o "$APP/Contents/MacOS/BlogEditor" tools/macos/BlogEditor.swift -framework Cocoa -framework WebKit
cp tools/macos/AppIcon.icns "$APP/Contents/Resources/AppIcon.icns"
cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>$NAME</string>
  <key>CFBundleDisplayName</key><string>$NAME</string>
  <key>CFBundleIdentifier</key><string>io.github.chunyunglo.blog-editor</string>
  <key>CFBundleExecutable</key><string>BlogEditor</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>2.0</string>
  <key>CFBundleVersion</key><string>2</string>
  <key>LSMinimumSystemVersion</key><string>12.0</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSAppTransportSecurity</key><dict><key>NSAllowsLocalNetworking</key><true/></dict>
  <key>RepoPath</key><string>$REPO</string>
</dict>
</plist>
PLIST
codesign --force --deep --sign - "$APP" >/dev/null 2>&1 || true

mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
# The app used to be called 文章編輯器; remove the old copy.
rm -rf "$(dirname "$DEST")/文章編輯器.app"
mv "$APP" "$DEST"
rm -rf "$TMP"
touch "$DEST"
echo "已安裝：$DEST"
