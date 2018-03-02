#!/usr/bin/env node

'use strict';

var fs = require("fs"),
  commander = require("commander"),
  shapefile = require("shapefile"),
  proj4 = require("proj4"),
  replaceExt = require('replace-ext');;

commander
  .version(require("./package.json").version)
  .usage("[options] [file]")
  .description("Convert a Shapefile to GeoJSON.")
  .option("-o, --out <file>", "output file name; defaults to '-' for stdout", "-")
  .option("-n, --newline-delimited", "output newline-delimited JSON")
  .option("-g, --geometry", "output geometries (implies --ignore-properties)")
  .option("--ignore-properties", "don't read shapefile properties (.dbf)")
  .option("--encoding <encoding>", "character encoding for shapefile properties (.dbf)")
  .option("--crs-name <name>", "specify a named CRS for the output feature collection")
  .option("--convert-coordinates", "enable convert coordinates")
  .option("--epsg-from <value>", "value of Shapefile's EPSG for convert coordinates. default is EPSG:4326(+proj=longlat +datum=WGS84 +no_defs)")
  .option("--epsg-to <value>", "value of output EPSG for convert coordinates. default is EPSG:4326(+proj=longlat +datum=WGS84 +no_defs)")
  .parse(process.argv);

if (commander.args.length === 0) commander.args[0] = "-";
else if (commander.args.length !== 1) {
  console.error();
  console.error("  error: multiple input files");
  console.error();
  process.exit(1);
}

var out = (commander.out === "-" ? process.stdout : fs.createWriteStream(commander.out)).on("error", handleEpipe);

// Loading convert coordinates config
// [Loading Priority of FromCoordinates]
//   commander.epsgFrom > shape_name.prj file > default("+proj=longlat +datum=WGS84 +no_defs")
try {
  var epsgFrom = commander.epsgFrom || fs.readFileSync(replaceExt(commander.args[0], ".prj"), "utf8");
} catch (err) {
  if (err.code === 'ENOENT') {
    var epsgFrom = "+proj=longlat +datum=WGS84 +no_defs";
  } else {
    throw err;
  }
}
var epsgTo = commander.epsgTo || "+proj=longlat +datum=WGS84 +no_defs";
proj4.defs("EPSG:FROM", epsgFrom);
proj4.defs("EPSG:TO", epsgTo);

shapefile.open(
    commander.args[0] === "-" ? process.stdin : commander.args[0],
    commander.geometry || commander.ignoreProperties ? null : undefined, {
      encoding: commander.encoding
    })
  .then(commander.newlineDelimited ?
    (commander.geometry ? writeNewlineDelimitedGeometries : writeNewlineDelimitedFeatures) :
    (commander.geometry ? writeGeometryCollection : writeFeatureCollection))
  .catch(handleError);

function writeNewlineDelimitedGeometries(source) {
  return source.read().then(function repeat(result) {
    if (result.done) return;
    if (commander.convertCoordinates) {
      var transformed = transformCoordinates(result.value.geometry.coordinates);
      result.value.geometry.coordinates = transformed;
    }
    out.write(JSON.stringify(result.value.geometry));
    out.write("\n");
    return source.read().then(repeat);
  }).then(function () {
    if (out !== process.stdout) out.end();
  });
}

function writeNewlineDelimitedFeatures(source) {
  return source.read().then(function repeat(result) {
    if (result.done) return;
    if (commander.convertCoordinates) {
      var transformed = transformCoordinates(result.value.geometry.coordinates);
      result.value.geometry.coordinates = transformed;
    }
    out.write(JSON.stringify(result.value));
    out.write("\n");
    return source.read().then(repeat);
  }).then(function () {
    if (out !== process.stdout) out.end();
  });
}

function writeGeometryCollection(source) {
  out.write("{\"type\":\"GeometryCollection\"");
  out.write(",\"geometries\":[");
  return source.read().then(function (result) {
    if (result.done) return;
    if (commander.convertCoordinates) {
      var transformed = transformCoordinates(result.value.geometry.coordinates);
      result.value.geometry.coordinates = transformed;
    }
    out.write(JSON.stringify(result.value.geometry));
    return source.read().then(function repeat(result) {
      if (result.done) return;
      if (commander.convertCoordinates) {
        var transformed = transformCoordinates(result.value.geometry.coordinates);
        result.value.geometry.coordinates = transformed;
      }
      out.write(",");
      out.write(JSON.stringify(result.value.geometry));
      return source.read().then(repeat);
    });
  }).then(function () {
    out[out === process.stdout ? "write" : "end"]("]}\n");
  });
}

function writeFeatureCollection(source) {
  out.write("{\"type\":\"FeatureCollection\"");
  if (commander.crsName) {
    out.write(",\"crs\":{\"type\":\"name\",\"properties\":{\"name\":");
    out.write(JSON.stringify(commander.crsName + ""));
    out.write("}}");
  }
  out.write(",\"features\":[");
  return source.read().then(function (result) {
    if (result.done) return;
    if (commander.convertCoordinates) {
      var transformed = transformCoordinates(result.value.geometry.coordinates);
      result.value.geometry.coordinates = transformed;
    }
    out.write(JSON.stringify(result.value));
    return source.read().then(function repeat(result) {
      if (result.done) return;
      if (commander.convertCoordinates) {
        var transformed = transformCoordinates(result.value.geometry.coordinates);
        result.value.geometry.coordinates = transformed;
      }
      out.write(",");
      out.write(JSON.stringify(result.value));
      return source.read().then(repeat);
    });
  }).then(function () {
    out[out === process.stdout ? "write" : "end"]("]}\n");
  });
}

function transformCoordinates(coordinates) {
  var _coords = [];
  if (coordinates.length == 2 && !Array.isArray(coordinates[0]) && !Array.isArray(coordinates[1])) {
    return proj4("EPSG:FROM", "EPSG:TO", coordinates);
  } else {
    coordinates.forEach(v => _coords.push(transformCoordinates(v)));
  }
  return _coords;
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