// Helpers
function addClass(el, classNameToAdd){
    el.className += ' ' + classNameToAdd;   
}

function removeClass(el, classNameToRemove){
    var elClass = ' ' + el.className + ' ';
    while(elClass.indexOf(' ' + classNameToRemove + ' ') !== -1){
         elClass = elClass.replace(' ' + classNameToRemove + ' ', '');
    }
    el.className = elClass;
}

function isCanvas(i) {
    return i instanceof HTMLCanvasElement;
}

const monthIndex = {
    'jan': 1,
    'feb': 2,
    'mar': 3,
    'apr': 4,
    'may': 5,
    'jun': 6,
    'jul': 7,
    'aug': 8,
    'sep': 9,
    'oct': 10,
    'nov': 11,
    'des': 12
}

// Create chart
const createChart = (containerId, chartData) => {
    let registries = [];
    let labels = [];
    let series = [];
    if (chartData.hasOwnProperty('service_registry_values')) {
        registries = chartData['service_registry_values'];
    }
    if (registries.length === 0) {
        // Empty
        return;
    }
    for (let i=0; i<registries.length; i++) {
        try {
            if (!registries[i]['value']) {
                continue;
            }
            let month = registries[i]['name'].match(/\((.*?)\)/)[1];
            series.push(parseFloat(registries[i]['value']));
            labels.push(monthIndex[month.substring(0,3).toLowerCase()]);
        } catch (err) {console.log(err)};
    }
    new Chartist.Line(`#${containerId}`, {
        labels: labels,
        series: [series]
    });
};

const createRaw = (containerId, data) => {
    let container = document.getElementById(containerId);
    container.innerHTML = JSON.stringify(data, null, 1);
};

(function () {
    // Element variables
    let latElm = document.getElementById('lat');
    let lonElm = document.getElementById('lon');
    let fetchBtn = document.getElementById('fetch-button');
    let geocontextDataElm = document.getElementById('geocontext-data');
    let loadingContainer = document.getElementsByClassName('loading-container')[0];
    let geocontextGroupSelect = document.getElementById('geocontext-group-select');
    let responseTimeWrapper = document.getElementsByClassName('response-time')[0];

    let defaultLon = 23.55;
    let defaultLat = -30.55;
    let geocontextGroup = '';
    let startFetchTime = null;
    let endFetchTime = null;
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
            loadingContainer.style.display = 'none';
            fetchBtn.disabled = false;
            alert('Request failed.  Returned status of ' + xhr.status);
        }
    };

    // Openlayer Map
    const map = new ol.Map({
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
    const createOrMoveMapMarker = (coord, setCenter=false) => {
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
        if (setCenter) {
            map.getView().animate({
                center: coord,
                zoom: 5,
                duration: 300
            });
        }
    };

    // Geocoder
    //Instantiate with some options and add the Control
    const geocoder = new Geocoder('nominatim', {
        provider: 'osm',
        lang: 'en',
        placeholder: 'Search for ...',
        limit: 5,
        debug: false,
        autoComplete: true,
        keepOpen: true,
        preventDefault: true
    });
    map.addControl(geocoder);

    // Events
    let coordinateInputChanged = (e) => {
        let lon = lonElm.value;
        let lat = latElm.value;
        if (lon && lat) {
            let coord = ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
            createOrMoveMapMarker(coord, true);
        }
    };
    let coordinateInputClicked = (e) => {
        if (e.keyCode === 13) {
            coordinateInputChanged(e);
        }
    };
    latElm.addEventListener('focusout', coordinateInputChanged);
    lonElm.addEventListener('focusout', coordinateInputChanged);
    latElm.addEventListener('keyup', coordinateInputClicked);
    lonElm.addEventListener('keyup', coordinateInputClicked);

    // Set default lat lon
    lonElm.value = defaultLon;
    latElm.value = defaultLat;
    coordinateInputChanged();

    // Listen when an address is chosen
    geocoder.on('addresschosen', function (evt) {
        if (evt.bbox) {
            map.getView().fit(evt.bbox, { duration: 500 });
        } else {
            map.getView().animate({ zoom: 14, center: evt.coordinate });
        }
        window.setTimeout(function () {
            let coord = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
            lonElm.value = coord[0].toFixed(4);
            latElm.value = coord[1].toFixed(4);
            createOrMoveMapMarker(evt.coordinate);
        }, 500);
    });

    map.on('click', function (evt) {
        let coord = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
        lonElm.value = coord[0].toFixed(4);
        latElm.value = coord[1].toFixed(4);
        createOrMoveMapMarker(evt.coordinate);
    });

    fetchBtn.addEventListener("click", function(){
        this.disabled = true;
        loadingContainer.style.display = 'block';
        geocontextDataElm.style.display = 'none';
        responseTimeWrapper.style.display = 'none';
        let lon = lonElm.value;
        let lat = latElm.value;

        geocontextGroup = geocontextGroupSelect.querySelector('.selected').dataset.value;
        startFetchTime = (new Date()).getTime();
        xhr.open('GET', `${geocontextUrl}/${lon}/${lat}/${geocontextGroup}`);
        xhr.send();
    });

    createChart('tab3', rainfallData);
    createRaw('geocontext-data', rainfallData);

    const tabClicked = (e) => {
        const tab = e.target.getAttribute("data-for");
        const tabContent = document.getElementById(tab);

        const activeTabContent = tabContent.parentElement.querySelectorAll(".active");
        [].forEach.call(activeTabContent, function(el) {
            el.classList.remove("active");
        });

        [].forEach.call(e.target.parentElement.querySelectorAll(".active"), function(el){
            el.classList.remove("active");
        });

        addClass(e.target, "active");
        addClass(tabContent, "active");
        if (tabContent.dataset.chart === 'true') {
            tabContent.__chartist__.update();
        }
    };

    Array.from(document.getElementsByClassName("tab-option")).forEach(function(element) {
        element.addEventListener("click", tabClicked);
    });

})();

