var yelp_ID = keys.CLIENT_ID;
var yelp_KEY = keys.CLIENT_SECRET;

function ViewModel(){
    var self = this;

    self.toggleNavbar = function(element, e2){
        $("#navbar").toggle("slide", 300);
    }
};

ko.applyBindings(new ViewModel());