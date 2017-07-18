function ViewModel(categories){
    var self = this;
    self.categories = categories;
    // console.log(Object.keys(self.categories));
    self.category_list = ko.observableArray(Object.keys(self.categories));

    console.log(self.category_list());

    self.toggleNavbar = function(element, e2){
        $("#navbar").toggle("slide", 300);
        console.log(self.test)
    }
};

// ko.applyBindings(new ViewModel());

$.ajax("/yelp", {
    success: function(data, status){
        console.log(data);
        console.log(status);
    }
});

$.ajax("/categories", {
    success: function(data, status){
        cats = $.parseJSON(data);
        categories = {};

        for(key in cats){
            var item = cats[key];
            if ($.inArray("food", item["parents"]) != -1) {
                var add = true

                if ("country_whitelist" in item) 
                    if ($.inArray("US", item["country_whitelist"]) == -1)
                        add = false;

                if ("country_blacklist" in item)
                    if ($.inArray("US", item["country_blacklist"]) != -1)
                        add = false;

                if (add)
                    categories[item["title"]] = item["alias"];
            }
        }
        // console.log(categories);
        ko.applyBindings(new ViewModel(categories));
    }
});

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