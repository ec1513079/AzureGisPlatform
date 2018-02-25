var fs = require("fs"),
    mkdirp = require("mkdirp"),
    request = require('request'),
    shapefile = require('shapefile'),
    proj4 = require("proj4");
const del = require('del');

module.exports = function (context, queueItem) {

    context.log('JavaScript queue trigger function processed work item', queueItem);

    // Pre setting proj4
    proj4.defs("EPSG:FROM", queueItem.epsg_from || "+proj=longlat +datum=WGS84 +no_defs");
    proj4.defs("EPSG:TO", queueItem.epsg_to || "+proj=longlat +datum=WGS84 +no_defs");

    // Create Working dirctory
    var execPath = context.executionContext.functionDirectory;
    var workDir = `${execPath}\\tmp\\${context.invocationId}`;
    mkdirp.sync(workDir);

    // Download Shape file and Dbf file
    var tmpShpfilePath = `${workDir}\\tmp.shp`;
    var tmpDbffilePath = `${workDir}\\tmp.dbf`;
    var requestShp = new Promise(resolve =>
        request(queueItem.shp_url)
        .pipe(fs.createWriteStream(tmpShpfilePath))
        .on('finish', resolve));
    var requestDbf = new Promise(resolve =>
        request(queueItem.dbf_url)
        .pipe(fs.createWriteStream(tmpDbffilePath))
        .on('finish', resolve));
    Promise.all([requestShp, requestDbf])
        .then(function (sources) {
            // Convert Shapefile to GeoJSON
            return shapefile.open(tmpShpfilePath, tmpDbffilePath, {
                    encoding: queueItem.shp_encoding
                })
                .then(writeFeatureCollection)
                .then(function (geojson) {
                    context.bindings.outputBlob = geojson;
                    context.done();
                });
        }).catch(function (err) {
            context.log.error(err.stack);
            context.done(err.stack);
        }).then(function () {
            // finally: delete working dirctory
            del(workDir, {
                force: true
            });
        });
};

function writeFeatureCollection(source) {
    var geojson = "";
    geojson += "{\"type\":\"FeatureCollection\"";
    geojson += ",\"features\":[";
    return source.read().then(function (result) {
        if (result.done) return;

        // Convert Coordinate
        var transformed = transformCoordinates(result.value.geometry.coordinates);
        result.value.geometry.coordinates = transformed;

        geojson += JSON.stringify(result.value);
        return source.read().then(function repeat(result) {
            if (result.done) return;

            // Convert Coordinate
            var transformed = transformCoordinates(result.value.geometry.coordinates);
            result.value.geometry.coordinates = transformed;

            geojson += ",";
            geojson += JSON.stringify(result.value);
            return source.read().then(repeat);
        });
    }).then(function () {
        geojson += "]}\n";
        return geojson;
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