# ShapeToGeoJSON
## ヘルプ
```
node shp2json.js -h
```
## テスト用ファイルで試してみる
```
node shp2json.js -o ./test/out/01100.geojson --encoding shift_jis --convert-coordinates --epsg-from "+proj=tmerc +lat_0=44 +lon_0=142.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs" --epsg-to "+proj=longlat +datum=WGS84 +no_defs" ./test/01100札幌市2017_5.shp
```
### 各パラメータの意味

|-o ./test/out/01100.geojson|変換結果をファイルに出力|
|--encoding shift_jis|Shapefileのエンコード|
|--convert-coordinates|座標変換を実行|
|--epsg-from "+proj=tmerc +lat_0=44 +lon_0=142.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"|Shapefileの座標系(日本測地系2000 : Japan Plane Rectangular CS XII)|
|--epsg-to "+proj=longlat +datum=WGS84 +no_defs"|変換後の測地系(世界測地系1984 : WGS84)|

### 出力されたGeoJSONの確認
http://geojson.io とかで出力されたGeoJSONを読み込んでみる。
