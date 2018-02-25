var fs = require("fs"),
    mkdirp = require("mkdirp"),
    request = require('request'),
    shapefile = require('shapefile'),
    proj4 = require("proj4");

module.exports = function (context, shapeBlob) {

    context.log("JavaScript blob trigger function processed blob \n Name:", context.bindingData.name, "\n Blob Size:", shapeBlob.length, "Bytes");

    // Pre setting proj4
    proj4.defs("EPSG:FROM", "+proj=longlat +datum=WGS84 +no_defs");
    proj4.defs("EPSG:TO", "+proj=longlat +datum=WGS84 +no_defs");

    // Create Working dirctory
    var execPath = context.executionContext.functionDirectory;
    var tmpDir = `${execPath}\\tmp\\${context.invocationId}`;
    mkdirp.sync(tmpDir);

    // Download Shape file and Dbf file
    var requestShp = new Promise(resolve =>
        request('http://127.0.0.1:10000/devstoreaccount1/shapefile/01100.shp?st=2018-02-25T12%3A51%3A00Z&se=2018-02-26T12%3A51%3A00Z&sp=rwdl&sv=2017-04-17&sr=b&sig=ZSYHN%2BhLyJENElEx0qDe%2FXE5XCVde%2BFjeQWsjNQln6c%3D')
        .pipe(fs.createWriteStream(`${tmpDir}\\tmp.shp`))
        .on('finish', resolve));
    var requestDbf = new Promise(resolve =>
        request('http://127.0.0.1:10000/devstoreaccount1/shapefile/01100.dbf?st=2018-02-25T06%3A51%3A00Z&se=2018-02-28T06%3A51%3A00Z&sp=rwdl&sv=2017-04-17&sr=b&sig=PPHQlKXhDU8trydbL0kFFmBDqkr7q4WtmUCTkhyFvJQ%3D')
        .pipe(fs.createWriteStream(`${tmpDir}\\tmp.dbf`))
        .on('finish', resolve));
    Promise.all([requestShp, requestDbf]).then(function (sources) {
        shapefile.open(`${tmpDir}\\tmp.shp`, `${tmpDir}\\tmp.dbf`, {
                encoding: "shift_jis"
            })
            .then(source => source.read()
                .then(function log(result) {
                    if (result.done) return;
                    context.log(result.value);
                    context.done();
                }))
            .catch(function (err) {
                context.log.error(err.stack);
                context.done();
            });
    }).catch(function (err) {
        context.log.error(err);
        context.done();
    });
};

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
};

function transformCoordinates(coordinates) {
    var _coords = [];
    coordinates.forEach(function (points, index, ar) {
        var _points = [];
        points.forEach(function (point, indexx, arr) {
            var transformed = proj4("EPSG:FROM", "EPSG:TO", point);
            _points.push([transformed[0], transformed[1]]);
        });
        _coords.push(_points);
    });
    return _coords;
};

function handleEpipe(error) {
    if (error.code === "EPIPE" || error.errno === "EPIPE") {
        process.exit(0);
    }
};

function handleError(error) {
    console.error();
    console.error("  error: " + error.message);
    console.error();
    process.exit(1);
};