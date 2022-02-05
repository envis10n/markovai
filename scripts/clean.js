const fs = require("fs");
const path = require("path");

const cwd = process.cwd();

const BUILD_DIR = path.resolve(cwd, "build");
const BUILD_FILE = path.resolve(cwd, ".tsbuild");

if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, {recursive: true, force: true});
}

if (fs.existsSync(BUILD_FILE)) {
    fs.rmSync(BUILD_FILE);
}