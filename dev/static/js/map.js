var map;
var markers = [];

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
        markers.push(new_marker);
        bounds.extend(new_marker.position);
    });

    map.fitBounds(bounds);
};

function clear_markers(){
    markers.forEach(function(marker){
        marker.setMap(null);
    });
}