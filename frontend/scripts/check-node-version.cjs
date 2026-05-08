const [major, minor] = process.versions.node.split(".").map(Number);

const supported =
  (major === 20 && minor >= 9) ||
  major === 21 ||
  major === 22 ||
  major === 23;

if (!supported) {
  console.error("");
  console.error("Unsupported Node.js version for this project.");
  console.error(`Detected: v${process.versions.node}`);
  console.error("Use Node.js 22 LTS (recommended) or Node.js 20.9+ below v24.");
  console.error("After switching Node versions, reinstall dependencies and run `npm run dev` again.");
  console.error("");
  process.exit(1);
}
