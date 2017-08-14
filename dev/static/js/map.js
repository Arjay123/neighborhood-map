const SANJOSE_COORD = {lat: 37.3382, lng: -121.8863}; // default map coordinates
const DEFAULT_ZOOM = 11; // default map zoom
const days = {
    '0': 'Mon',
    '1': 'Tue',
    '2': 'Wed',
    '3': 'Thu',
    '4': 'Fri',
    '5': 'Sat',
    '6': 'Sun',
}; // days of the week

let map; // google maps map object
let infoWindow; // info window, only one will be displayed at any time
let activeMarker; // id of currently active marker
let svService; // google streetview service object
let pano; // google streetview panorama container
let markers = {}; // dictionary of all currently visible markers
let bounds; // google maps bounds object
let deferred = $.Deferred(); // Deferred object to notify KO that map is done loading

// initialize google maps service
//
function initMap(){

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: DEFAULT_ZOOM,
        center: SANJOSE_COORD,
    });
    infoWindow = new google.maps.InfoWindow();
    svService = new google.maps.StreetViewService();

    deferred.resolve();
}

function mapLoadError(){
    alert("Error loading google maps API");
}

// create markers on map for every restaurant in list
//
// restaurants - list of restaurant objects to create markers for
//
function addMarkers(restaurants){

    let show_default = restaurants.length == 0;

    // reset map bounds
    bounds = new google.maps.LatLngBounds();

    restaurants.forEach(function(restaurant){

        show_default = show_default || restaurant.visible;
        if(restaurant.visible()){
            let newMarkers = new google.maps.Marker({
                position: {lat: restaurant.coordinates.latitude, lng: restaurant.coordinates.longitude },
                map: map,
                animation: google.maps.Animation.DROP
            });


            newMarkers.addListener('click', function(){
                showRestaurantWindow(restaurant);
            });

            newMarkers.addListener('mouseover', function(){
                newMarkers.setAnimation(google.maps.Animation.BOUNCE);
            });

            newMarkers.addListener('mouseout', function(){
                newMarkers.setAnimation(null);
            });

            // add new marker to list of markers
            markers[restaurant.id] = newMarkers;

            // extend map bounds to include new marker
            bounds.extend(newMarkers.position);
        }
    });

    // if no restaurants, reset to default map view
    if(show_default){
        map.setOptions({
            zoom: DEFAULT_ZOOM,
            center: SANJOSE_COORD,
        });
        return;
    }
    else {
        map.fitBounds(bounds);
    }

}

// change which marker is currently active
//
// id - id of new active marker
//
function changeActiveMarker(id){
    resetActiveMarker();
    activeMarker = id;
}

// reset active marker icon to default 'non-active' marker
//
function resetActiveMarker(){
    if(activeMarker in markers){
        let marker = markers[activeMarker];
        marker.setIcon();
    }

}

// show restaurants information in an info window, set marker to active
//
// restaurant - restaurant object to display detailed info
//
function showRestaurantWindow(restaurant){

    if(!(restaurant.id in markers)){
        console.log('can\'t show window, marker not present');
        return;
    }

    changeActiveMarker(restaurant.id);
    createWindow(restaurant);
    changeColor(restaurant.id);
}

// create more detailed restaurant info window using yelp data
//
// restaurant - restaurant object
//
function createWindow(restaurant){

    // request more detailed restaurant data using yelp business api endpoint
    // TODO - add error/fail handler function
    $.ajax('/yelp_business?id=' + restaurant.id, {
        success: function(response, status){
            response = $.parseJSON(response);

            // show error window if request failed
            if(response.status != 200){
                showErrorWindow(restaurant.id, response.status, response.data);
                return;
            }

            data = $.parseJSON(response.data);

            let address = data.location.display_address;
            let phone = data.display_phone;
            let hours = data.hours;

            showWindow(restaurant, address, phone, hours);

        },
        error: function(jqXHR, textStatus, errorThrown){
            alert('Not able to retrieve restaurant information from Yelp API');
        }
    });

}

// set info window to display an error
//
// restaurantID - id of marker to display info window at
// status - status code of error
// errorMsg - error message
//
function showErrorWindow(restaurantID, status, errorMsg){

    let marker = markers[restaurantID];

    let content = $('<div id="info_window">' +
                                '<p>Error ' + status + ': ' + errorMsg + '</p>' +
                            '</div>');
    infoWindow.close();
    infoWindow.setContent(content[0]);
    infoWindow.open(map, marker);
}



// create hours for day from hour object from yelp api
//
// day - day object
//
function createHourText(day){
    return days[day.day] + ': ' +
               day.start.slice(0, 2) + ':' + day.start.slice(2, 4) + ' - ' +
               day.end.slice(0, 2) + ':' + day.end.slice(2, 4);
}

// set info window to display more detailed restaurant data
//
// restaurant - restaurant object
// address - address of restaurant
// phone - phone number of restaurant
// hours - hours of operation for restaurant
//
function showWindow(restaurant, address, phone, hours){

    let marker = markers[restaurant.id];

    let detailsHtml = '<div class="flex-item"><table>';

    address.forEach(function(line){
        detailsHtml += '<tr><td>' + line + '</td></tr>';
    });

    detailsHtml += '<tr><td>' + phone + '</td></tr>';
    detailsHtml += '<tr><td><a href="' + restaurant.url + '">View on Yelp</a></td></tr>';
    detailsHtml += '</table></div>';

    let hoursHtml = '<div class="flex-item"><table>';

    if(hours == null) {
        hoursHtml += '<tr><td> Unable to retrieve hours information from Yelp </td></tr>'
    } else {
        hours[0].open.forEach(function(day){
            hoursHtml += '<tr><td>' + createHourText(day) + '</td></tr>';
        });
    }


    hoursHtml += '</table></div>';

    let content = $('<div id="infoindow">' +
                      '<div class="info-window-hdr">' +
                          '<h3>' + restaurant.name + '</h3>' +
                      '</div>' +
                      '<div class="flex-container restaurant-details">' +
                          detailsHtml + hoursHtml +
                      '</div>' +
                      '<div id="pano">' +
                      '</div>' +
                    '</div>');

    infoWindow.close();
    infoWindow.setContent(content[0]);
    infoWindow.open(map, marker);
    marker.setIcon();

    // get nearest google streetview panorama to restaurant location and display in infowindow
    let restLocation = new google.maps.LatLng(restaurant.coordinates.latitude, restaurant.coordinates.longitude);
    pano = new google.maps.StreetViewPanorama(document.getElementById('pano'));

    svService.getPanorama({location: restLocation,
                            radius: 50},
                            function(data, status){
                                if(status === 'OK'){

                                    let svHeading = google.maps.geometry.spherical.computeHeading(
                                        data.location.latLng,
                                        restLocation);

                                    pano.setPano(data.location.pano);
                                    pano.setPov({heading: svHeading, pitch:0});
                                    pano.setVisible(true);

                                } else {
                                    pano.setVisible(false);
                                    $('#pano').html('<h3>Could not find a nearby streetview for this address</h3>');
                                }
                            });
    map.setStreetView(pano);

}

// change color of marker to yellow
//
// restaurantID - id of marker to change color
//
function changeColor(restaurantID){
    let marker = markers[restaurantID];
    marker.setIcon('http://maps.google.com/mapfiles/ms/icons/yellow-dot.png');
}

// resize map to fit its current container
//
function resizeMap(){

    google.maps.event.trigger(map, 'resize');
    if(bounds)
        map.fitBounds(bounds);

    if(infoWindow.getMap() !== null && typeof infoWindow.getMap() !== 'undefined'){
        infoWindow.close();
        infoWindow.open(map, markers[activeMarker]);
    }

}

// clear all currently visible map markers
//
function clearMarkers(){
    for(let key in markers){
        if(markers.hasOwnProperty(key))
            markers[key].setMap(null);
    }
    markers = {};
}

// turn off marker's bounce animation
//
// restaurant - restaurant to turn off marker animation
//
function markerBounceOff(restaurant){
    if(!(restaurant.id in markers)){
        console.log('can\'t change animation, marker not present');
        return;
    }

    let marker = markers[restaurant.id];
    marker.setAnimation(null);

}

// turn on marker's bounce animation
//
// restaurant - restaurant to turn on marker animation
//
function markerBounceOn(restaurant){
    if(!(restaurant.id in markers)){
        console.log('can\'t change animation, marker not present');
        return;
    }

    let marker = markers[restaurant.id];
    marker.setAnimation(google.maps.Animation.BOUNCE);
}
