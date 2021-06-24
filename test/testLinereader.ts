import assert from "assert";
import fs from "fs";
import path from "path";
import { BackwardLineReader } from "../core/linereader";
import "mocha";

describe("Line reader", function () {
  it("should produce reversed contents of file", function () {
    const test_file = path.join(__dirname, "./sample_file.txt");
    let lines: string[] = fs.readFileSync(test_file, "utf-8").split("\n");
    // don't want an empty \n at the end
    lines.pop();
    let reader = new BackwardLineReader(test_file);
    let reversed_lines: string[] = [];
    while (true) {
      let next_line = reader.next();
      if (next_line == null) break;
      reversed_lines.push(next_line);
    }

    lines.forEach((line, idx) => {
      const from_reversed = reversed_lines.pop();
      assert.strictEqual(
        line,
        from_reversed,
        `${idx}\tExpected '${line}' but got '${from_reversed}'`
      );
    });
  });
});
