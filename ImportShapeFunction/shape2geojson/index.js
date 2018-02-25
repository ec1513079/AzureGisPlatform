var fs = require("fs"),
    fstream = require("fstream"),
    mkdirp = require("mkdirp"),
    unzipper = require("unzipper"),
    memStreams = require('memory-streams'),
    shapefile = require('shapefile'),
    request = require('request-promise');

// function writeFeatureCollection(source) {
//     out.write("{\"type\":\"FeatureCollection\"");
//     if (commander.crsName) {
//         out.write(",\"crs\":{\"type\":\"name\",\"properties\":{\"name\":");
//         out.write(JSON.stringify(commander.crsName + ""));
//         out.write("}}");
//     }
//     out.write(",\"features\":[");
//     return source.read().then(function (result) {
//         if (result.done) return;
//         if (commander.convertCoordinates) {
//             var transformed = transformCoordinates(result.value.geometry.coordinates);
//             result.value.geometry.coordinates = transformed;
//         }
//         out.write(JSON.stringify(result.value));
//         return source.read().then(function repeat(result) {
//             if (result.done) return;
//             if (commander.convertCoordinates) {
//                 var transformed = transformCoordinates(result.value.geometry.coordinates);
//                 result.value.geometry.coordinates = transformed;
//             }
//             out.write(",");
//             out.write(JSON.stringify(result.value));
//             return source.read().then(repeat);
//         });
//     }).then(function () {
//         out[out === process.stdout ? "write" : "end"]("]}\n");
//     });
// }

// function transformCoordinates(coordinates) {
//     var _coords = [];
//     coordinates.forEach(function (points, index, ar) {
//         var _points = [];
//         points.forEach(function (point, indexx, arr) {
//             var transformed = proj4("EPSG:FROM", "EPSG:TO", point);
//             _points.push([transformed[0], transformed[1]]);
//         });
//         _coords.push(_points);
//     });
//     return _coords;
// }

// function handleEpipe(error) {
//     if (error.code === "EPIPE" || error.errno === "EPIPE") {
//         process.exit(0);
//     }
// }

// function handleError(error) {
//     console.error();
//     console.error("  error: " + error.message);
//     console.error();
//     process.exit(1);
// }

module.exports = function (context, shapeBlob) {

    context.log("JavaScript blob trigger function processed blob \n Name:", context.bindingData.name, "\n Blob Size:", shapeBlob.length, "Bytes");

    var execPath = context.executionContext.functionDirectory;


    // shapefile.open("C:\\Users\\WINDOWS\\Source\\Repos\\AzureGisPlatform\\ImportShapeFunction\\shape2geojson\\tmp\\f9e251f1-60e1-4c8f-aeb6-324dbb99b5bf\\shape\\01100.shp", "C:\\Users\\WINDOWS\\Source\\Repos\\AzureGisPlatform\\ImportShapeFunction\\shape2geojson\\tmp\\f9e251f1-60e1-4c8f-aeb6-324dbb99b5bf\\dbf\\01100.dbf", {
    //     encoding: "shift_jis"
    //   })
    // .then(source => source.read()
    //     .then(function log(result) {
    //         if (result.done) return;
    //         context.log(result.value);
    //         context.done();
    //     }))
    // .catch(error => context.log.error(error.stack));

    var requestShp = request('http://127.0.0.1:10000/devstoreaccount1/shapefile/01100.shp?st=2018-02-25T12%3A51%3A00Z&se=2018-02-26T12%3A51%3A00Z&sp=rwdl&sv=2017-04-17&sr=b&sig=ZSYHN%2BhLyJENElEx0qDe%2FXE5XCVde%2BFjeQWsjNQln6c%3D');
    var requestDbf = request('http://127.0.0.1:10000/devstoreaccount1/shapefile/01100.dbf?st=2018-02-25T06%3A51%3A00Z&se=2018-02-28T06%3A51%3A00Z&sp=rwdl&sv=2017-04-17&sr=b&sig=PPHQlKXhDU8trydbL0kFFmBDqkr7q4WtmUCTkhyFvJQ%3D');
    Promise.all([requestShp, requestDbf]).then(function (sources) {
        var shpBody = new Buffer(sources[0], 'binary');
        // var dbfBody = new Buffer(sources[1], 'binary');
        // var shpBody = Buffer.from(sources[0].toString(), 'shift_jis');
        // var dbfBody = Buffer.from(sources[1].toString(), 'shift_jis');
        shapefile.open(shpBody, {
                encoding: "shift_jis"
            })
            .then(source => source.read()
                .then(function log(result) {
                    if (result.done) return;
                    context.log(result.value);
                    context.done();
                }))
            .catch(error => context.log.error(error.stack));
    }).catch(function (err) {
        context.log.error(err);
        context.done();
    });

    // shapefile.open(url.parse('http://127.0.0.1:10000/devstoreaccount1/shapefile/01100.shp?st=2018-02-25T12%3A51%3A00Z&se=2018-02-26T12%3A51%3A00Z&sp=rwdl&sv=2017-04-17&sr=b&sig=ZSYHN%2BhLyJENElEx0qDe%2FXE5XCVde%2BFjeQWsjNQln6c%3D'), url.parse('http://127.0.0.1:10000/devstoreaccount1/shapefile/01100.dbf?st=2018-02-25T21%3A51%3A00Z&se=2018-02-26T21%3A51%3A00Z&sp=rwdl&sv=2017-04-17&sr=b&sig=n1hqlfHb%2Fsbr8hRUWHhO0EJBifzcmeulXIRQYy2p8GQ%3D'), {
    //     encoding: "shift_jis"
    //   })
    // .then(source => source.read()
    //     .then(function log(result) {
    //         if (result.done) return;
    //         context.log(result.value);
    //         context.done();
    //     }))
    // .catch(error => context.log.error(error.stack));

    // 作業ディレクトリの作成
    // var tmpDir = `${execPath}\\tmp\\${context.invocationId}`;
    // mkdirp(tmpDir, function (err) {
    //     if (err) {
    //         context.log.error(err);
    //         context.done();
    //     } else {
    //         context.log(`TmpDir : ${tmpDir}`);

    //         // ZIPファイル解凍
    //         var zipStream = new memStreams.ReadableStream(shapeBlob);
    //         zipStream.pipe(unzipper.Extract({
    //             path: tmpDir
    //         })).on('error', function (err) {
    //             context.log.error(err);
    //             context.done();
    //         }).on('close', function () {

    //             shapefile.open(`${tmpDir}\\${context.bindingData.name}.shp`)
    //                 .then(source => source.read()
    //                     .then(function log(result) {
    //                         if (result.done) return;
    //                         context.log(result.value);
    //                         context.done();
    //                     }))
    //                 .catch(error => context.log.error(error.stack));
    //         });

    //     }
    // });

};

// 文字列から ArrayBuffer への変換
function string_to_buffer(src) {
    return (new Uint16Array([].map.call(src, function (c) {
        return c.charCodeAt(0)
    }))).buffer;
};