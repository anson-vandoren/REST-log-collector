# REST log collection

This is a simple demonstration of collecting log files via a REST API from a remote
Unix-based machine. It will provide full or partial logs from any files found
in `/var/log` on the machine hosting the server.

## Requirements:

* Customer interface is a HTTP REST request.
  
* Customer must be able to query the following:
  * for a specific file in `/var/log`.
  * for last `n` events in a specified file.
  * basic text/keyword filtering of events.

* The results returned must be reverse time ordered.

* Cannot use any pre-built log aggregation systems.

* Must minimize use of external dependencies for business logic.

## Bonus / Stretch Goals

* Implement the ability for one 'master' server to retrieve logs from a list
  of other remote machines.
  
* Provide a basic UI for demonstration purposes.


# Usage

## Servers (machines with logs of interest)

```shell
$ git clone https://github.com/anson-vandoren/REST-log-collector
$ cd REST-log-collector
$ yarn && yarn start
```

## Clients (to retrieve logs from remote servers)

### Option 1: `curl`

**List logs available**

```shell
$ curl localhost:3000/log
["README","Xorg.0.log","Xorg.0.log.old","Xorg.1.log","btmp","eopkg.log","lastlog","usysconf.log","wtmp"]
```

**Get contents of specific log**

```shell
$ curl localhost:3000/log/eopkg.log | jq
[
#...
  "2021-02-03 12:01:02,659: INFO     Removed dracut",
  "2021-02-03 12:01:02,599: INFO     Removed binutils",
  "2021-02-03 12:01:02,517: INFO     Removed bash-recovery"
]
```

**Get last `n` log entries**

```shell
$ curl 'localhost:3000/log/eopkg.log?lines=10' | jq
[
  "2021-06-22 08:22:42,188: ERROR    Repo item zoom not found",
#... (8 lines) ...
  "2021-06-13 14:48:22,905: INFO     Extracting the files of python-cairo"
]
```

**Get lines that include either `python` or `perl`**

```shell
$ curl 'localhost:3000/log/eopkg.log?term=python&term=perl'
#...
  "2021-05-25 08:57:18,105: INFO     Installed perl-libnet",
  "2021-05-25 08:57:18,089: INFO     Extracting the files of perl-libnet",
  "2021-05-24 14:55:22,279: INFO     Removed python-parted",
  "2021-05-24 14:55:22,264: INFO     Removed python-geoip"
]
```

**Get lines that include both `perl` and `ssh`**

```shell
$ curl 'localhost:3000/log/eopkg.log?term=perl&term=ssl&searchType=and'
[
  "2021-05-25 08:57:18,083: INFO     Installed perl-io-socket-ssl",
  "2021-05-25 08:57:18,066: INFO     Extracting the files of perl-io-socket-ssl",
  "2021-05-25 08:57:17,996: INFO     Installed perl-net-smtp-ssl",
  "2021-05-25 08:57:17,988: INFO     Extracting the files of perl-net-smtp-ssl"
]
```

### Option 2: Postman

Import the [collection](./postman_collection.json) file into Postman and
run the various included GET requests. Change Environments > Globals > `{{api_root}}`
to a different host and port if desired (defaults to `http://localhost:3000`)

### Option 3: Web interface

With the server running, navigate to the remote server in a browser, at the
default port of 3000. I.e., `http://localhost:3000/`


# Not implemented

Due to the limited nature of this demo, the following, while they
may be useful in a more fully-featured utility, have not
been implemented here.

- [ ] Authentication
- [ ] Caching
- [ ] Recursively walking `/var/log`, or searching alternative paths
- [ ] Streaming large files instead of waiting for full file system read
- [ ] Related to above, pagination of results for large files
- [ ] Filtering by date/timestamp
