#!/bin/sh
# Builds "文章編輯器.app" for this repository and installs it into ~/Applications.
# Usage: sh tools/macos/build-app.sh
set -e
cd "$(dirname "$0")/../.."
REPO="${REPO:-$(pwd)}"
NAME="文章編輯器"
DEST="${DEST:-$HOME/Applications/$NAME.app}"
TMP="$(mktemp -d)"

sed "s|__REPO__|$REPO|" tools/macos/BlogEditor.applescript > "$TMP/app.applescript"
osacompile -s -o "$TMP/$NAME.app" "$TMP/app.applescript"

APP="$TMP/$NAME.app"
cp tools/macos/AppIcon.icns "$APP/Contents/Resources/applet.icns"
PL="$APP/Contents/Info.plist"
# Use our .icns instead of the default script icon in the asset catalog.
/usr/libexec/PlistBuddy -c "Delete :CFBundleIconName" "$PL" 2>/dev/null || true
rm -f "$APP/Contents/Resources/Assets.car"
/usr/libexec/PlistBuddy -c "Set :CFBundleName $NAME" "$PL" 2>/dev/null || /usr/libexec/PlistBuddy -c "Add :CFBundleName string $NAME" "$PL"
/usr/libexec/PlistBuddy -c "Add :CFBundleDisplayName string $NAME" "$PL" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :CFBundleIdentifier string io.github.chunyunglo.blog-editor" "$PL" 2>/dev/null || /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier io.github.chunyunglo.blog-editor" "$PL"
/usr/libexec/PlistBuddy -c "Add :LSMinimumSystemVersion string 11.0" "$PL" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :NSHumanReadableCopyright string 羅俊詠" "$PL" 2>/dev/null || true
codesign --force --deep --sign - "$APP" >/dev/null 2>&1 || true

mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
mv "$APP" "$DEST"
rm -rf "$TMP"
touch "$DEST"
echo "已安裝：$DEST"
