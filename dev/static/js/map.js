var map;
var markers = {};

function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 11,
        center: {lat: 37.3382, lng: -121.8863},
    });

}


function add_markers(restaurants){


    var bounds = new google.maps.LatLngBounds();

    restaurants.forEach(function(restaurant){

        var new_marker = new google.maps.Marker({
            position: {lat: restaurant.coordinates.latitude, lng: restaurant.coordinates.longitude },
            map: map,
            animation: google.maps.Animation.DROP
        });
        markers[restaurant.id] = (new_marker);
        bounds.extend(new_marker.position);
    });

    map.fitBounds(bounds);
};

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