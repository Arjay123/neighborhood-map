function ViewModel(){
    var self = this;

    self.toggleNavbar = function(element, e2){
        $("#navbar").toggle("slide", 300);
    }
};

ko.applyBindings(new ViewModel());


// $.ajax("https://api.yelp.com/v3/businesses/search?location=San%20Jose", {
//     data: {
//         grant_type: "client_credentials",
//         client_id: yelp_ID,
//         client_secret: yelp_KEY
//     },
//     success: function(data, status, jqXHR){
//         console.log(data);
//         console.log(status);
//     },
//     error: function(jqXHR, status, error){
//         console.log(error);
//         console.log(status);
//         console.log(jqXHR);
//     },
//     dataType: "jsonp",
//     cache: true,
//     async: false,
//     method: "POST"
// });