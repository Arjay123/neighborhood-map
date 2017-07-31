var map; // google maps map object
var info_window; // info window, only one will be displayed at any time
var active_marker; // id of currently active marker
var sv_service; // google streetview service object
var pano; // google streetview panorama container
var SANJOSE_COORD = {lat: 37.3382, lng: -121.8863}; // default map coordinates
var DEFAULT_ZOOM = 11; // default map zoom
var markers = {}; // dictionary of all currently visible markers
var bounds; // google maps bounds object


// initialize google maps service
//
function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: DEFAULT_ZOOM,
        center: SANJOSE_COORD,
    });
    info_window = new google.maps.InfoWindow();
    sv_service = new google.maps.StreetViewService();
}

// create markers on map for every restaurant in list
//
// restaurants - list of restaurant objects to create markers for
//
function add_markers(restaurants){

    // if no restaurants passed, reset to default map view
    if(restaurants.length == 0){
        map.setOptions({
            zoom: DEFAULT_ZOOM,
            center: SANJOSE_COORD,
        });
        return;
    }

    // reset map bounds
    bounds = new google.maps.LatLngBounds();

    restaurants.forEach(function(restaurant){

        var new_marker = new google.maps.Marker({
            position: {lat: restaurant.coordinates.latitude, lng: restaurant.coordinates.longitude },
            map: map,
            animation: google.maps.Animation.DROP
        });

        
        new_marker.addListener("click", function(){
            show_restaurant_window(restaurant);
        });

        new_marker.addListener("mouseover", function(){
            new_marker.setAnimation(google.maps.Animation.BOUNCE);
        });

        new_marker.addListener("mouseout", function(){
            new_marker.setAnimation(null);
        });

        // add new marker to list of markers
        markers[restaurant.id] = new_marker;

        // extend map bounds to include new marker
        bounds.extend(new_marker.position);
    });

    map.fitBounds(bounds);
};

// change which marker is currently active
//
// id - id of new active marker
//
function change_active_marker(id){
    reset_active_marker();
    active_marker = id;
};

// reset active marker icon to default 'non-active' marker
//
function reset_active_marker(){
    if(active_marker in markers){
        var marker = markers[active_marker];
        marker.setIcon();    
    }
    
};

// show restaurants information in an info window, set marker to active
// 
// restaurant - restaurant object to display detailed info
//
function show_restaurant_window(restaurant){

    if(!(restaurant.id in markers)){
        console.log("can't show window, marker not present");
        return;
    }

    change_active_marker(restaurant.id);
    create_window(restaurant);
    change_color(restaurant.id);
};

// create more detailed restaurant info window using yelp data
//
// restaurant - restaurant object
//
function create_window(restaurant){

    // request more detailed restaurant data using yelp business api endpoint
    // TODO - add error/fail handler function
    $.ajax("/yelp_business?id=" + restaurant.id, {
        success: function(response, status){
            response = $.parseJSON(response);

            // show error window if request failed
            if(response["status"] != 200){
                show_error_window(restaurant.id, response["status"], response["data"]);
                return;
            }

            data = $.parseJSON(response["data"]);

            var address = data["location"]["display_address"];
            var phone = data["display_phone"];
            var hours = data["hours"];

            show_window(restaurant, address, phone, hours);
            
        }
    });

};

// set info window to display an error
//
// restaurant_id - id of marker to display info window at
// status - status code of error
// error_msg - error message
//
function show_error_window(restaurant_id, status, error_msg){

    var marker = markers[restaurant_id];

    var content = $("<div id='info_window'>" +
                                "<p>Error " + status + ": " + error_msg + "</p>" +
                            "</div>");
    info_window.close();
    info_window.setContent(content[0]);
    info_window.open(map, marker);
}

// set info window to display more detailed restaurant data
//
// restaurant - restaurant object
// address - address of restaurant
// phone - phone number of restaurant
// hours - hours of operation for restaurant
//
function show_window(restaurant, address, phone, hours){

    var marker = markers[restaurant.id];
    
    var details_html = "<table>";

    address.forEach(function(line){
        details_html += "<tr><td>" + line + "</td></tr>";
    });

    details_html += "<tr><td>" + phone + "</td></tr>";
    details_html += "</table>";

    var content = $("<div id='info_window'>" + 
                      "<div class='info-window-hdr'>" + 
                          "<h3>" + restaurant.name + "</h3>" +
                      "</div>" + 
                      "<div class='restaurant-details'>" + 
                          details_html +
                      "</div>" + 
                      "<div id='pano'>" +
                      "</div>" +
                    "</div>");



    info_window.close();
    info_window.setContent(content[0]);
    info_window.open(map, marker);
    marker.setIcon();

    // get nearest google streetview panorama to restaurant location and display in infowindow
    var rest_location = new google.maps.LatLng(restaurant.coordinates.latitude, restaurant.coordinates.longitude)
    pano = new google.maps.StreetViewPanorama(document.getElementById("pano"));

    sv_service.getPanorama({location: rest_location,
                            radius: 50},
                            function(data, status){
                                if(status === "OK") {

                                    var sv_heading = google.maps.geometry.spherical.computeHeading(
                                        data.location.latLng, 
                                        rest_location);

                                    pano.setPano(data.location.pano);
                                    pano.setPov({heading: sv_heading, pitch:0});
                                    pano.setVisible(true);

                                } else {

                                    pano.setVisible(false);

                                }
                            });
    map.setStreetView(pano);

}

// change color of marker to yellow
//
// restaurant_id - id of marker to change color
//
function change_color(restaurant_id){
    var marker = markers[restaurant_id];
    marker.setIcon("http://maps.google.com/mapfiles/ms/icons/yellow-dot.png");
}

// resize map to fit its current container
//
function resize_map(){

    google.maps.event.trigger(map, "resize");
    if(bounds)
        map.fitBounds(bounds);

    if(info_window.getMap() !== null && typeof info_window.getMap() !== "undefined"){
        info_window.close();
        info_window.open(map, markers[active_marker]);
    }

}

// clear all currently visible map markers
//
function clear_markers(){
    for(var key in markers){
        markers[key].setMap(null);
    };
    markers = {};
};

// toggle marker's bounce animation
//
// restaurant - restaurant to toggle marker animation
//
function toggle_marker_bounce(restaurant){
    if(!(restaurant.id in markers)){
        console.log("can't change animation, marker not present");
        return;
    }

    var marker = markers[restaurant.id];
    if(marker.getAnimation() !== null){
        marker.setAnimation(null);
    }
    else{
        marker.setAnimation(google.maps.Animation.BOUNCE);
    }
};
