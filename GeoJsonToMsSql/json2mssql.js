#!/usr/bin/env node
'use strict';

Object.prototype.values = function () { var o = this; var r = []; for (var k in o) if (o.hasOwnProperty(k)) { r.push(o[k]) } return r };
Object.prototype.keys = function () { var o = this; var r = []; for (var k in o) if (o.hasOwnProperty(k)) { r.push(k) } return r };

var fsout = require("fs"),
    fsin = require("fs"),
    path = require('path'),
    commander = require("commander"),
    wellknown = require("wellknown");

commander
    .version(require("./package.json").version)
    .usage("[options] [file]")
    .description("Convert a GeoJSON to MS SQL.")
    .option("-o, --out <file>", "output file name; defaults to '-' for stdout", "-")
    .option("--ignore-properties", "don't output geojson properties")
    .option("--encoding <encoding>", "character encoding for geojson properties: defaults is 'utf8'")
    .option("--table <tablename>", "target table name for insert: defaults is geojson file name (without extension)")
    .option("--geo-column <columnname>", "column name of geometry: defaults is 'Geometry'")
    .option("--srid <srid>", "geometry's srid : defaults is 0")
    .option("--middleware <filepath>", "file path of middleware javascript : defaults is './middleware.js'")
    .parse(process.argv);

if (commander.args.length !== 1) {
    console.error();
    console.error("  error: multiple input files");
    console.error();
    process.exit(1);
}

var out = (commander.out === "-" ? process.stdout : fsout.createWriteStream(commander.out)).on("error", handleEpipe);

var tablename = commander.table || path.basename(commander.args[0], path.extname(commander.args[0]));
var geocolname = commander.geoColumn || "Geometry";
var srid = commander.srid || 0;
var middleware = require(commander.middleware || "./middleware.js");
middleware.init(path.basename(commander.args[0]), tablename, geocolname, srid);

var file = fsin.readFileSync(commander.args[0], commander.encoding || "utf8");
var geojson = JSON.parse(file);

writeSqlHeader();
geojson.features.forEach(function (feature, index, ar) {
    middleware.featureMiddleware(feature);
    writeSqlInsert(feature);
});

function writeSqlHeader() {
    out.write("SET NOCOUNT ON;\n");
    out.write("\n");
}

function writeSqlInsert(feature) {
    out.write(`INSERT INTO [${tablename}] (`);
    if (!commander.ignoreProperties) {
        feature.properties.keys().forEach(function (pKey, index, ar) { out.write(`[${pKey}], `); });
    }
    out.write(`[${geocolname}]`);
    out.write(`) `);
    out.write(`VALUES (`);
    if (!commander.ignoreProperties) {
        feature.properties.values().forEach(function (pVal, index, ar) { out.write(`N'${pVal}', `); });
    }
    var wkt = wellknown.stringify(feature);
    out.write(`geometry::STGeomFromText(N'${wkt}', ${srid})`);
    out.write(`);`);
    out.write("\n");
}

function handleEpipe(error) {
    if (error.code === "EPIPE" || error.errno === "EPIPE") {
        process.exit(0);
    }
}

function handleError(error) {
    console.error();
    console.error("  error: " + error.message);
    console.error();
    process.exit(1);
}