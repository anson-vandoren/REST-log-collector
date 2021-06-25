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

export class BackwardsStream extends Readable {
  reader: BackwardLineReader;
  limit: number;
  terms?: string[];
  andSearch?: boolean;
  linesSent: number = 0;
  firstPush = true;

  constructor(
    filename: string,
    limit: number,
    terms?: string[],
    andSearch?: boolean
  ) {
    super();
    const fullPath = path.join(baseDir, filename);
    this.reader = new BackwardLineReader(fullPath);
    this.limit = limit;
    this.terms = terms;
    this.andSearch = andSearch;
  }

  _read(n: number) {
    let nextLine = this.reader.next();
    if (nextLine === null) {
      return this.push(null);
    }

    // check if we need to match search terms, and skip if no match
    if (this.terms && this.terms.length > 0) {
      let isMatch = this.andSearch
        ? this.terms.every((term) => nextLine!.includes(term))
        : this.terms.some((term) => nextLine!.includes(term));
      if (!isMatch) {
        // skip to next line
        this._read(0);
        return;
      }
    }

    // don't push a newline in front of the first line
    if (this.firstPush) {
      this.firstPush = false;
    } else {
      // push newlines before each line, 'cause can't take them back if pushed at the end
      this.push("\n");
    }

    // push this line down the stream
    this.push(nextLine);

    // stop pushing if we hit a limit
    this.linesSent++;
    if (this.linesSent >= this.limit) {
      return this.push(null);
    }
  }

  _destroy(error: Error | null, callback: (error?: Error | null) => void) {
    super._destroy(error, callback);
    this.reader.close();
  }
}
