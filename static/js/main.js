(function () {
    // Element variables
    let latElm = document.getElementsByClassName('lat')[0];
    let lonElm = document.getElementsByClassName('lon')[0];
    let fetchBtn = document.getElementById('fetch-button');
    let geocontextDataElm = document.getElementById('geocontext-data');
    let loadingContainer = document.getElementsByClassName('loading-container')[0];
    let geocontextGroupSelect = document.getElementById('geocontext-group-select');
    let responseTimeWrapper = document.getElementsByClassName('response-time')[0];

    let geocontextGroup = '';
    let startFetchTime = null;
    let endFetchTime = null;
    let lat = 0;
    let lon = 0;
    let geocontextUrl = 'https://geocontext.kartoza.com/api/v1/geocontext/value/group';
    let styleJson = 'https://a.tiles.mapbox.com/v2/aj.1x1-degrees.json';
    if (mapTileKey) {
       styleJson = 'https://api.maptiler.com/maps/streets/256/tiles.json?key=' + mapTileKey;
    }

    // XHR request
    let xhr = new XMLHttpRequest();
    xhr.onload = function() {
        if (xhr.status === 200) {
            endFetchTime = (new Date()).getTime();
            loadingContainer.style.display = 'none';
            let jsonDataString = JSON.parse(xhr.responseText);

            responseTimeWrapper.innerHTML = `Response time : ${endFetchTime - startFetchTime} ms`;
            responseTimeWrapper.style.display = 'block';

            geocontextDataElm.innerHTML = JSON.stringify(jsonDataString, null, 1);
            geocontextDataElm.style.display = 'block';

            fetchBtn.disabled = false;
        }
        else {
            alert('Request failed.  Returned status of ' + xhr.status);
        }
    };

    // Openlayer Map
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
        view: new ol.View({
            center: [0, 0],
            zoom: 2
        })
    });

    // Map ICON
    let iconFeature = null;
    let createOrMoveMapMarker = (coord) => {
        if (!iconFeature) {
            iconFeature = new ol.Feature({
                geometry: new ol.geom.Point([0, 0]),
            });
            iconFeature.setStyle(new ol.style.Style({
                image: new ol.style.Icon({
                    anchor: [0.5, 135],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'pixels',
                    scale: 0.3,
                    src: 'static/location-pointer.png'
                })
            }));
            let iconLayer = new ol.layer.Vector({
                source: new ol.source.Vector({
                    features: [iconFeature]
                })
            });
            map.addLayer(iconLayer);
        }
        iconFeature.getGeometry().setCoordinates(coord);
    };

    // Events
    map.on('singleclick', function (evt) {
        let coord = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
        lon = coord[0];
        lat = coord[1];
        lonElm.innerHTML = lon.toFixed(3);
        latElm.innerHTML = lat.toFixed(3);
        createOrMoveMapMarker(evt.coordinate);
    });

    fetchBtn.addEventListener("click", function(){
        this.disabled = true;
        loadingContainer.style.display = 'block';
        geocontextDataElm.style.display = 'none';
        responseTimeWrapper.style.display = 'none';

        geocontextGroup = geocontextGroupSelect.querySelector('.selected').dataset.value;
        startFetchTime = (new Date()).getTime();
        xhr.open('GET', `${geocontextUrl}/${lon}/${lat}/${geocontextGroup}`);
        xhr.send();
    });

})();

