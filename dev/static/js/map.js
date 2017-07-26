var map;
var info_window;
var active_marker;

var markers = {};

function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 11,
        center: {lat: 37.3382, lng: -121.8863},
    });
    info_window = new google.maps.InfoWindow();

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

function show_restaurant(restaurant){
    change_active_marker(restaurant.id);
    open_window(restaurant);
    change_color(restaurant.id);
};


function open_window(restaurant){

    var marker = markers[restaurant.id];
    var content = "<div><div class='info-window-hdr'>" + 
                    "<h3>" + restaurant.name + "</h3>" +
                  "</div>" + 
                  "<div class='restaurant-details'>" + 
                    "<div data-bind='template: { name: rating }'></div>" +
                  "</div></div>";
    
    info_window.close();
    info_window.setContent(content);
    info_window.open(map, marker);
    marker.setIcon();


};

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
    var marker = markers[restaurant.id];
    if(marker.getAnimation() !== null){
        marker.setAnimation(null);
    }
    else{
        marker.setAnimation(google.maps.Animation.BOUNCE);
    }
};