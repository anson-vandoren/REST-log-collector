import { CommonRoute } from "./common";
import express from "express";
import { getNFilteredLines, listFiles, streamNFilteredLines } from "../core/filesystem";

export class LogRoute extends CommonRoute {
  constructor(app: express.Application) {
    super(app, "LogRoute");
  }

  configureRoutes(): express.Application {
    // list all log files
    this.app
      .route(`/log`)
      .get((req: express.Request, res: express.Response) => {
        try {
          let logFiles = listFiles();
          // log files may change frequently, so don't cache them
          res.set("Cache-Control", "no-store");
          return res.status(200).json(logFiles);
        } catch (e) {
          return res.status(500).send(`Failed to list logs: ${e}`);
        }
      });

    // list the contents (possibly filtered) of `filename`
    this.app
      .route("/log/:filename")
      .get((req: express.Request, res: express.Response) => {
        // fail early if bad query params
        // check if only N lines should be returned
        let nLines = req.query.lines
          ? parseInt(req.query.lines as string, 10)
          : Infinity;

        if (isNaN(nLines)) {
          return res
            .status(400)
            .send(`'lines' should be a number, not ${req.query.lines}`);
        }

        // check if the lines should be filtered
        let termArray: string[] = [];
        if (typeof req.query.term === "string") {
          termArray = [req.query.term];
        } else if (Array.isArray(req.query.term)) {
          termArray = req.query.term as string[];
        }
        // by default, search terms are OR'ed unless specified otherwise
        const andSearch: boolean =
          termArray.length > 0 &&
          (req.query.searchType?.toString().toLowerCase() === "and" ?? false);

        // stream-read the log file backwards until sufficient matches are found
        const filename = req.params.filename;
        let returnedLines;
        let streamer;
        try {
          // returnedLines = getNFilteredLines(
          //   filename,
          //   nLines,
          //   termArray,
          //   andSearch
          // );
          streamer = streamNFilteredLines(filename, nLines, termArray, andSearch);
        } catch (e) {
          if (e.code === "ENOENT") {
            return res.status(404).send(`${filename} not found in /var/log/`);
          } else {
            return res.status(500).send(`Failed to get ${filename}`);
          }
        }

        // log files may change frequently, so don't cache them
        res.set("Cache-Control", "no-store");

        streamer.pipe(res);

        return res.status(200);
      });

    return this.app;
  }
}
