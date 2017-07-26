var map;
var info_window;
var active_marker;
var sv_service;
var pano;

var markers = {};

function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 11,
        center: {lat: 37.3382, lng: -121.8863},
    });
    info_window = new google.maps.InfoWindow();
    sv_service = new google.maps.StreetViewService();

}


function add_markers(restaurants){


    var bounds = new google.maps.LatLngBounds();

    restaurants.forEach(function(restaurant){

        var new_marker = new google.maps.Marker({
            position: {lat: restaurant.coordinates.latitude, lng: restaurant.coordinates.longitude },
            map: map,
            animation: google.maps.Animation.DROP
        });

        

        

        new_marker.addListener("click", function(){
            show_restaurant(restaurant);
        });

        new_marker.addListener("mouseover", function(){
            new_marker.setAnimation(google.maps.Animation.BOUNCE);
        });

        new_marker.addListener("mouseout", function(){
            new_marker.setAnimation(null);
        });

        markers[restaurant.id] = new_marker;
        bounds.extend(new_marker.position);
    });

    map.fitBounds(bounds);
};


function change_active_marker(id){
    reset_active_marker();
    active_marker = id;
};

function reset_active_marker(){
    if(active_marker){
        var marker = markers[active_marker];
        marker.setIcon();    
    }
    
};

function show_restaurant_window(restaurant){

    if(!(restaurant.id in markers)){
        console.log("can't show window, marker not present");
        return;
    }

    change_active_marker(restaurant.id);
    create_window(restaurant);
    change_color(restaurant.id);
};


function create_window(restaurant){

    $.ajax("/yelp_business?id=" + restaurant.id, {
        success: function(response, status){
            response = $.parseJSON(response);
            console.log(response);
            data = $.parseJSON(response["data"]);

            var address = data["location"]["display_address"];
            var phone = data["display_phone"];
            var hours = data["hours"];

            show_window(restaurant, address, phone, hours);
            
        }
    });

};

function show_window(restaurant, address, phone, hours){

    var marker = markers[restaurant.id];
    
    
    var details_html = "<table>";

    address.forEach(function(line){
        details_html += "<tr><td>" + line + "</td></tr>";
    });

    details_html += "<tr><td>" + phone + "</td></tr>";
    details_html += "</table>";

    var content = "<div>" + 
                      "<div class='info-window-hdr'>" + 
                          "<h3>" + restaurant.name + "</h3>" +
                      "</div>" + 
                      "<div class='restaurant-details'>" + 
                          details_html +
                      "</div>" + 
                  "</div>" + 
                  "<div id='pano'>" +
                  "</div>";



    info_window.close();
    info_window.setContent(content);
    info_window.open(map, marker);
    marker.setIcon();


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


function change_color(restaurant_id){
    var marker = markers[restaurant_id];
    marker.setIcon("http://maps.google.com/mapfiles/ms/icons/yellow-dot.png");
}



function clear_markers(){
    for(var key in markers){
        markers[key].setMap(null);
    };
    markers = {};
};


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