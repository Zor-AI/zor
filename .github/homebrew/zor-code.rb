class ZorCode < Formula
  desc "Open-source AI coding agent for the terminal"
  homepage "https://github.com/zor-ai/zor"
  license "MIT"

  on_macos do
    url "https://github.com/zor-ai/zor/releases/latest/download/zor-code-darwin-arm64"
  end

  on_linux do
    url "https://github.com/zor-ai/zor/releases/latest/download/zor-code-linux-x86_64"
  end

  def install
    if OS.mac?
      bin.install "zor-code-darwin-arm64" => "zor-code"
    elsif OS.linux?
      bin.install "zor-code-linux-x86_64" => "zor-code"
    end
  end

  test do
    assert_match "zor-code", shell_output("#{bin}/zor-code --version 2>&1 || true")
  end
end
