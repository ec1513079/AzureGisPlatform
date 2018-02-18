var fs = require("fs")
  , mkdirp = require("mkdirp")
  , unzip = require("unzip")
  , memStreams = require('memory-streams');

module.exports = function (context, shapeBlob) {

    context.log(`JavaScript blob trigger function processed blob \n Name: ${context.bindingData.name} \n Blob Size: ${shapeBlob.length} Bytes`);

    // 作業ディレクトリの作成
    mkdirp(`./tmp/${context.invocationId}/`, function (err) {
        if (err) throw err;
    });

    // ZIPファイル解凍
    var zipStream = new memStreams.ReadableStream(shapeBlob);
    zipStream.pipe(unzip.Extract({
        path: `./tmp/${context.invocationId}/`
    }));

    context.done();
};