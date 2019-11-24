// import Map from 'ol/Map';
// import View from 'ol/View';
// import {defaults as defaultControls, FullScreen} from 'ol/control';
// import TileLayer from 'ol/layer/Tile';
// import OSM from 'ol/source/OSM';

(function () {
    let view = new ol.View({
        center: [0, 0],
        zoom: 2
    });

    let styleJson = 'https://a.tiles.mapbox.com/v3/aj.1x1-degrees.json';
    if (mapTileKey) {
       styleJson = 'https://api.maptiler.com/maps/bright/256/tiles.json?key=' + mapTileKey;
    }

    let map = new ol.Map({
        layers: [
            new ol.layer.Tile({
                source: new ol.source.TileJSON({
                    url: styleJson,
                    crossOrigin: 'anonymous',
                })
            })
        ],
        target: 'map',
        view: view
    });
    // let map_vue = new Vue({
    //     el: '#map',
    //     data: {
    //         message: 'Hello Vue!'
    //     }
    // });
})();
