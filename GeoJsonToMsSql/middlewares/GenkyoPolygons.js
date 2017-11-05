// middleware.js
var _geojson_file_name,
    _tablename,
    _geocolname,
    _srid;
var Middleware = {

    init: function (filename, tablename, geocolname, srid) {
        _geojson_file_name = filename;
        _tablename = tablename;
        _geocolname = geocolname;
        _srid = srid;
    },

    featureMiddleware: function (feature) {

        feature.properties.PrefectureCd = _geojson_file_name.substr(0, 2);
        feature.properties.CityJisCd = _geojson_file_name.substr(0, 5);
        var timoku = feature.properties.耕地の種類;
        delete feature.properties.耕地の種類;
        feature.properties.Timoku = timoku;

    },
};
module.exports = Middleware;