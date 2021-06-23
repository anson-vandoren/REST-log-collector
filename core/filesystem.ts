import fs from "fs";
import path from "path";

const baseDir = "/var/log/";

/**
 * Returns an array of all files found in `/var/log/` directory
 * @param recurse if true, recursively walk folders and return all files found in subfolders as well
 */
export function listFiles(recurse: boolean = false): string[] {
  if (recurse) {
    // NOTE: recursive directory search not specified as a requirement, but could be useful since `/var/log` does
    //       tend to contain subfolders
    throw new Error("recursive directory walking not implemented");
  }
  let paths = fs.readdirSync(baseDir, { withFileTypes: true });

  // filter out directories and return just filenames
  return paths.filter((path) => path.isFile()).map((dirent) => dirent.name);
}

/**
 * Returns newline-delimited, chronologically-reversed lines from a given filename (assuming the file
 * was originally written chronologically). Assumes the file can be found in `/var/log/`
 * @param filename filename relative to `/var/log/`
 * @throws ENOENT if the file is not found
 */
export function getAllLines(filename: string): string[] {
  // NOTE: assuming that all log files are written in chronological order, so reversing them will result
  //       in the desired reverse-chronological. I think this is a good assumption, but a more correct
  //       implementation might check first and last line timestamps to confirm this.
  const fullPath = path.join(baseDir, filename);
  try {
    const contents = fs.readFileSync(fullPath, "utf-8");
    return contents.trim().split("\n").reverse();
  } catch (e) {
    console.log(e);
    throw e;
  }
}
