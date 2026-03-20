/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoiY2hlbmphbmEiLCJhIjoiY21rNGdpc3BoMDdiNzNlb3Yxbm02dGpwOCJ9.xYpWe_CkRr_Oe_Q-DtaVYw'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

let legendcheck = document.getElementById('legendcheck'); // create variable for a legend button that can be checked
legend.style.display = legendcheck.checked ? 'block' : 'none';
legendcheck.addEventListener('click', () => { // check for button that is triggered by a click
    if (legendcheck.checked) {
        legendcheck.checked = true; // check if the legendcheck variable is true
        legend.style.display = 'block'; // if the legendcheck variable is true, hide the legend
    }
    else {
        legend.style.display = "none"; // reveal the legend
        legendcheck.checked = false;
    }
});

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/mapbox/standard',  // standard map style
    center: [-79.39, 43.65],  // starting point, longitude/latitude
    zoom: 11 // starting zoom level
});

let collisions = { // create empty collisions variable with features
    'type': 'FeatureCollection',
    'features': []
};
fetch('https://raw.githubusercontent.com/JananChen/GGR472Lab4/refs/heads/main/data/pedcyc_collision_06-21.geojson') // get the collision data
    .then(response => response.json())
    .then(response => {
        console.log(response); // check response in console
        collisions = response; // store geojson as variable using URL from fetch response
    });

// set data source and style on map load
map.on('load', () => {
    map.addSource('collisions', {
        type: 'geojson',  // add datasource using coliisions variable
        data: collisions
    });

    // set style for when new points are added to the data source
    map.addLayer({ // add layer for collisions point data styled with red circle size 4
        'id': 'collisions',
        'type': 'circle',
        'source': 'collisions',
        'paint': {
            'circle-radius': 4,
            'circle-color': 'red'
        }
    });
    layercheck.addEventListener('change', () => { // check if the layercheck is checked to toggle visibility of collisions points
        map.setLayoutProperty(
            'collisions',
            'visibility',
            layercheck.checked ? 'visible' : 'none'
        );
    });

    let envresult = turf.envelope(collisions); // create an 'envelope' around points and store as variable

    // add the envelope polygon created to the map
    map.addSource('envelopeGeoJSON', {
        "type": "geojson",
        "data": envresult  // use envelope json variable as data source
    })

    map.addLayer({ // add envelope layer using envelope data source and style as red and 0.1 opacity and black outline
        "id": "Envelope",
        "type": "fill",
        "source": "envelopeGeoJSON",
        "paint": {
            'fill-color': "red",
            'fill-opacity': 0.1,
            'fill-outline-color': "black"
        }
    });
    let bbox = turf.bbox(collisions); // create bounding box variable using the bounds of the collisions points
    let bboxpoly = turf.bboxPolygon(bbox) // convert bbox to polygon so that it can be scaled
    let scaledbbox = turf.transformScale(bboxpoly, 1.1); // use transformScale to increase the bbox size by 1.1 (10%)
    let bboxarray = turf.bbox(scaledbbox); // convert back to array for the hexgrid
    let hexgrid = turf.hexGrid(bboxarray, 0.5, { // create hexgrid within the scaled bounding box with 0.5 kilometer size
        units: 'kilometers'
    });

    let collishex = turf.collect(hexgrid, collisions, '_id', 'values'); // aggregate the collisions by hex

    let maxcollis = 0; // create maxcollis variable

    collishex.features.forEach((feature) => {
        feature.properties.COUNT = feature.properties.values.length // count the features in collishex
        if (feature.properties.COUNT > maxcollis) { // if the counted collisions is greater than the maxcollis
            console.log(feature);
            maxcollis = feature.properties.COUNT // update the maxcollis variable to the current count
        }
    });
    const legenditems = [
    { label: '0 - 17', colour: '#00d0ff' }, // create legend
    { label: '18 - 35', colour: '#00ffb3' },
    { label: '36 - 53', colour: '#bbff00' },
    { label: '54 - 71', colour: '#ffbb00' }, 
    { label: '72+', colour: '#000000' } 
    ];

// For each array item create a row to put the label and colour in
    legenditems.forEach(({ label, colour }) => {
        const row = document.createElement('div'); // each item gets a 'row' as a div - this isn't in the legend yet, we do this later
        const colcircle = document.createElement('span'); // create span for colour circle

        colcircle.className = 'legend-colcircle'; // the colcircle will take on the shape and style properties defined in css
        colcircle.style.setProperty('--legendcolour', colour); // a custom property is used to take the colour from the array and apply it to the css class

        const text = document.createElement('span'); // create span for label text
        text.textContent = label; // set text variable to tlegend label value in array

        row.append(colcircle, text); // add circle and text to legend row
        legend.appendChild(row); // add row to legend container
    });
    map.addSource('hexgrid', { // add hexgrid to the map
        type: 'geojson',
        data: collishex
    });
    map.addLayer({ // add hexgrid layer and symbolize
        id: 'hexgrid',
        type: 'fill',
        source: 'hexgrid',
        paint: {
            'fill-color': [
                'step',
                ['get', 'COUNT'],
                 '#00d0ff',
                maxcollis * 0.25, '#00ffb3', // create hexgrid steps by 25% percentiles
                maxcollis * 0.5, '#bbff00',
                maxcollis * 0.75, '#ffbb00',
                maxcollis, '#000000'
            ],
            'fill-opacity': 0.9,
            'fill-outline-color': 'black'
        }
    });
});



