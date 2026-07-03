#!/usr/bin/env bash
# Zor Code Unix installer
set -e

echo "Installing Zor Code..."

# Detect OS/arch
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Linux)  TARGET="linux-$ARCH" ;;
  Darwin) TARGET="darwin-$ARCH" ;;
  *)      echo "Unsupported OS: $OS"; exit 1 ;;
esac

INSTALL_DIR="$HOME/.zor"
BIN_DIR="$INSTALL_DIR/bin"
BINARY_URL="https://github.com/yourusername/zor/releases/latest/download/zor-code-$TARGET"
mkdir -p "$BIN_DIR"

echo "Downloading Zor Code for $OS/$ARCH..."
if command -v curl &>/dev/null; then
  curl -fsSL "$BINARY_URL" -o "$BIN_DIR/zor-code"
elif command -v wget &>/dev/null; then
  wget -q "$BINARY_URL" -O "$BIN_DIR/zor-code"
else
  echo "Need curl or wget"; exit 1
fi
chmod +x "$BIN_DIR/zor-code"

# Add to PATH for current shell
SHELL_NAME="$(basename "$SHELL")"
case "$SHELL_NAME" in
  zsh) SHELL_RC="$HOME/.zshrc" ;;
  bash) SHELL_RC="$HOME/.bashrc" ;;
  fish) SHELL_RC="$HOME/.config/fish/config.fish" ;;
  *) SHELL_RC="$HOME/.profile" ;;
esac

if [ "$SHELL_NAME" = "fish" ]; then
  if ! grep -q "$BIN_DIR" "$SHELL_RC" 2>/dev/null; then
    echo "set -gx PATH \$PATH $BIN_DIR" >> "$SHELL_RC"
    echo "Added $BIN_DIR to PATH in $SHELL_RC"
  fi
else
  if ! grep -q "$BIN_DIR" "$SHELL_RC" 2>/dev/null; then
    echo "export PATH=\"\$PATH:$BIN_DIR\"" >> "$SHELL_RC"
    echo "Added $BIN_DIR to PATH in $SHELL_RC"
  fi
fi

echo ""
echo "✓ Zor Code installed!"
echo ""
echo "Quick start:"
echo "  1. Set your API key:"
echo "     zor-code keys set anthropic sk-ant-xxxxxxxxxxxx"
echo ""
echo "  2. Run:"
echo "     zor-code"
echo ""
echo "  3. Or with Ollama:"
echo "     ollama pull qwen2.5-coder:14b"
echo "     zor-code"
echo ""
echo "  Type /help inside Zor Code for commands."