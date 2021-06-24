import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { BackwardLineReader } from "./linereader";

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

export function getNFilteredLines(
  filename: string,
  limit: number,
  terms?: string[],
  andSearch?: boolean
): string[] {
  const fullPath = path.join(baseDir, filename);
  const reader = new BackwardLineReader(fullPath);
  let validLines: string[] = [];
  while (validLines.length < limit) {
    let nextLine = reader.next();
    if (nextLine === null) break; // reached end (beginning) of file

    if (terms && terms.length > 0) {
      let isValid = andSearch
        ? terms.every((term) => nextLine!.includes(term))
        : terms.some((term) => nextLine!.includes(term));
      if (isValid) validLines.push(nextLine);
    } else {
      // no filter, so use the line
      validLines.push(nextLine);
    }
  }
  reader.close();
  return validLines;
}

export function streamNFilteredLines(
  filename: string,
  limit: number,
  terms?: string[],
  andSearch?: boolean): Readable {
    const fullPath = path.join(baseDir, filename);
    const reader = new BackwardLineReader(fullPath);

    return new Readable({
      read(size) {
        let nextLine = reader.next();
        if (nextLine === null) this.push(null);
        while (nextLine !== null) {
          if (terms && terms.length > 0) {
            let isValid = andSearch
              ? terms.every((term) => nextLine!.includes(term))
              : terms.some((term) => nextLine!.includes(term));
            if (isValid) {
              this.push(nextLine + '\n');
              break;
            }
          } else {
            // no filter, so use the line
            this.push(nextLine + '\n');
            break
          }
          nextLine = reader.next();
        }
      } 
    })

    }