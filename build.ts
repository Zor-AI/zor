import { $ } from "bun";

const result = await $`bun run --filter zor-code build`.cwd(import.meta.dir);
if (result.exitCode !== 0) {
  console.error("Build failed");
  process.exit(result.exitCode);
}
console.log("Build complete");
