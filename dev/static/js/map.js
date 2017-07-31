const SANJOSE_COORD = {lat: 37.3382, lng: -121.8863}; // default map coordinates
const DEFAULT_ZOOM = 11; // default map zoom
const days = {
    "0": "Mon",
    "1": "Tue",
    "2": "Wed",
    "3": "Thu",
    "4": "Fri",
    "5": "Sat",
    "6": "Sun",
}; // days of the week

let map; // google maps map object
let info_window; // info window, only one will be displayed at any time
let active_marker; // id of currently active marker
let sv_service; // google streetview service object
let pano; // google streetview panorama container
let markers = {}; // dictionary of all currently visible markers
let bounds; // google maps bounds object
let deferred = $.Deferred(); // Deferred object to notify KO that map is done loading

// initialize google maps service
//
function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: DEFAULT_ZOOM,
        center: SANJOSE_COORD,
    });
    info_window = new google.maps.InfoWindow();
    sv_service = new google.maps.StreetViewService();

    deferred.resolve();
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

        let new_marker = new google.maps.Marker({
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
}

// change which marker is currently active
//
// id - id of new active marker
//
function change_active_marker(id){
    reset_active_marker();
    active_marker = id;
}

// reset active marker icon to default 'non-active' marker
//
function reset_active_marker(){
    if(active_marker in markers){
        let marker = markers[active_marker];
        marker.setIcon();
    }

}

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
}

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

            let address = data["location"]["display_address"];
            let phone = data["display_phone"];
            let hours = data["hours"];

            show_window(restaurant, address, phone, hours);

        }
    });

}

// set info window to display an error
//
// restaurant_id - id of marker to display info window at
// status - status code of error
// error_msg - error message
//
function show_error_window(restaurant_id, status, error_msg){

    let marker = markers[restaurant_id];

    let content = $("<div id='info_window'>" +
                                "<p>Error " + status + ": " + error_msg + "</p>" +
                            "</div>");
    info_window.close();
    info_window.setContent(content[0]);
    info_window.open(map, marker);
}



// create hours for day from hour object from yelp api
//
// day - day object
//
function create_hour_text(day){
    return days[day["day"]] + ": " +
               day["start"].slice(0, 2) + ":" + day["start"].slice(2, 4) + " - " +
               day["end"].slice(0, 2) + ":" + day["end"].slice(2, 4);
}

// set info window to display more detailed restaurant data
//
// restaurant - restaurant object
// address - address of restaurant
// phone - phone number of restaurant
// hours - hours of operation for restaurant
//
function show_window(restaurant, address, phone, hours){

    let marker = markers[restaurant.id];

    let details_html = "<div class='flex-item'><table>";

    address.forEach(function(line){
        details_html += "<tr><td>" + line + "</td></tr>";
    });

    details_html += "<tr><td>" + phone + "</td></tr>";
    details_html += "<tr><td><a href='" + restaurant.url + "'>View on Yelp</a></td></tr>";
    details_html += "</table></div>";

    let hours_html = "<div class='flex-item'><table>";

    hours[0]["open"].forEach(function(day){
        hours_html += "<tr><td>" + create_hour_text(day) + "</td></tr>"
    });

    hours_html += "</table></div>";

    let content = $("<div id='info_window'>" +
                      "<div class='info-window-hdr'>" +
                          "<h3>" + restaurant.name + "</h3>" +
                      "</div>" +
                      "<div class='flex-container restaurant-details'>" +
                          details_html + hours_html +
                      "</div>" +
                      "<div id='pano'>" +
                      "</div>" +
                    "</div>");

    info_window.close();
    info_window.setContent(content[0]);
    info_window.open(map, marker);
    marker.setIcon();

    // get nearest google streetview panorama to restaurant location and display in infowindow
    let rest_location = new google.maps.LatLng(restaurant.coordinates.latitude, restaurant.coordinates.longitude)
    pano = new google.maps.StreetViewPanorama(document.getElementById("pano"));

    sv_service.getPanorama({location: rest_location,
                            radius: 50},
                            function(data, status){
                                if(status === "OK") {

                                    let sv_heading = google.maps.geometry.spherical.computeHeading(
                                        data.location.latLng,
                                        rest_location);

                                    pano.setPano(data.location.pano);
                                    pano.setPov({heading: sv_heading, pitch:0});
                                    pano.setVisible(true);

                                } else {
                                    pano.setVisible(false);
                                    $("#pano").html("<h3>Could not find a nearby streetview for this address</h3>");
                                }
                            });
    map.setStreetView(pano);

}

// change color of marker to yellow
//
// restaurant_id - id of marker to change color
//
function change_color(restaurant_id){
    let marker = markers[restaurant_id];
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
    for(let key in markers){
        markers[key].setMap(null);
    };
    markers = {};
}

// turn off marker's bounce animation
//
// restaurant - restaurant to turn off marker animation
//
function marker_bounce_off(restaurant){
    if(!(restaurant.id in markers)){
        console.log("can't change animation, marker not present");
        return;
    }

    let marker = markers[restaurant.id];
    marker.setAnimation(null);

}

// turn on marker's bounce animation
//
// restaurant - restaurant to turn on marker animation
//
function marker_bounce_on(restaurant){
    if(!(restaurant.id in markers)){
        console.log("can't change animation, marker not present");
        return;
    }

    let marker = markers[restaurant.id];
    marker.setAnimation(google.maps.Animation.BOUNCE);
}
