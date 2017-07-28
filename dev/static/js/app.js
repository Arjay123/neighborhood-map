// Restaurant object containing data from yelp's api service
//
// name - name of restaurant
// price - price of restaurant according to yelp's $ rating
// category - type of restaurant
// review_ct - number of reviews
// img - url of restaurant image
// coordinates - obj containing lat/lng of restaurant
// url - yelp url for restaurant
// id - restaurant id
// favorite - bool value whether restaurant has been favorited by the user
//
function Restaurant(name, price, category, rating, review_ct, img, coordinates, url, id, favorite=false){
    var self = this;

    this.name = name;
    this.price = price;
    this.category = category;
    this.rating = rating;
    this.review_ct = review_ct;
    this.img = img;
    this.coordinates = coordinates;
    this.url = url;
    this.id = id;
    this.favorite = ko.observable(favorite);

    // get ko template name of yelp's star rating imgs
    this.get_rating_template = function(){
        return "rating_" + self.rating;
    };

    // return restaurant as a json object
    this.serialize = function(){
        return {
            "name": self.name,
            "price": self.price,
            "category": self.category,
            "rating": self.rating,
            "review_ct": self.review_ct,
            "img": self.img,
            "coordinates": self.coordinates,
            "url": self.url,
            "id": self.id,
            "favorite": self.favorite()
        }
    };
}

// convert json object to a restaurant object
Restaurant.deserialize = function(obj){
    return new Restaurant(obj.name,
                          obj.price,
                          obj.category,
                          obj.rating,
                          obj.review_ct,
                          obj.img,
                          obj.coordinates,
                          obj.url,
                          obj.id,
                          obj.favorite);
};

// ko viewmodel
// 
// params:
//      categories - list of food categories from yelp's api service
//
function ViewModel(categories){

    var self = this;

    self.categories = categories; // list of categories
    self.restaurant_list = ko.observableArray(); // current list of restaurants to be displayed in navbar list
    self.favorites = ko.observableArray(); // list of user's favorite restaurants
    self.selected_view = ko.observable("categories"); // current selected view template
    self.fav_shown = ko.observable(false); // whether the user has selected to display their favorite restaurants over search results
    self.page = 0; // page number of results, used w/ list_per_page to create an offset for getting other results
    self.list_per_page = 10; // num of restaurant results to get per request
    self.current_category = null; // currently selected restaurant type
    self.total_current_restaurants = 0; // total restaurants of current selected category
    self.prev_available = ko.observable(false); // whether there are restaurants before the current list to retrieve
    self.next_available = ko.observable(false); // whether there are restaurants after the current list to retrieve
    self.error_msg = ko.observable(""); // error message in case of yelp api request failures
    self.category_list = ko.observableArray(Object.keys(self.categories)); // list of categories

    // load users favorite restaurants from local storage
    var prev_favs = JSON.parse(localStorage.getItem("favorites"));
    for(var i in prev_favs){
        self.favorites.push(Restaurant.deserialize(prev_favs[i]));
    }

    // toggle navbar visibility, only available for viewports of ipad or smaller
    self.toggleNavbar = function(){
        $("#navbar").toggle("slide", 300, resize_map);
    };

    // check if restaurant one of user's favorites
    self.get_fav_by_id = function(id){

        return ko.utils.arrayFirst(self.favorites(), function(item){
            return id.valueOf() === item.id.valueOf();
        });

    };

    // set whether previous results are available
    self.set_prev_available = function(){
        self.prev_available(self.page != 0);
    };

    // set whether more results are available
    self.set_next_available = function(){
        self.next_available((self.page * self.list_per_page) < self.total_current_restaurants);
    };

    // get next listings from yelp api
    self.get_next_listings = function(){

        var offset = ++self.page * self.list_per_page;
        self.yelp_ajax(self.current_category, offset);

    };

    // get previous lists from yelp api
    self.get_prev_listings = function(){

        var offset = --self.page * self.list_per_page;
        self.yelp_ajax(self.current_category, offset);

    };

    // category clicked event handler, call yelp api service to retrieve restaurants
    self.cat_clicked = function(element){

        self.page = 0;
        self.current_category = self.categories[element];
        self.yelp_ajax(self.current_category, 0);

    };

    // retrieve restaurant results based on category and offset
    self.yelp_ajax = function(category, offset){
        
        // clear current restaurant list        
        self.restaurant_list.removeAll();
        $.ajax("/yelp?category=" + category + "&offset=" + offset, {
            success: function(response, status, test){

                response = $.parseJSON(response);

                // if request fail, display error message instead
                if(response["status"] != 200){
                    self.error_msg("Error " + response["status"] + ": " + response["data"]);
                    self.selected_view("error");
                    return;
                }

                // store new restaurant results and display in navbar
                data = $.parseJSON(response["data"]);
                self.total_current_restaurants = data["total"];
                self.set_next_available();
                self.set_prev_available();
                for(index in data["businesses"]){
                    var curr = data["businesses"][index]
                    var restaurant = new Restaurant(curr["name"], 
                                                    curr["price"],
                                                    curr["categories"][0]["title"],
                                                    curr["rating"],
                                                    curr["review_count"],
                                                    curr["image_url"],
                                                    curr["coordinates"],
                                                    curr["url"],
                                                    curr["id"]);

                    // if restaurant is in user favorites, use that restaurant object instead
                    var match = self.get_fav_by_id(restaurant.id);
                    if (!match){
                        self.restaurant_list.push(restaurant);
                    }
                    else {
                        self.restaurant_list.push(match);
                    }
                    
                };

                // display markers for restaurant in google map
                clear_markers();
                add_markers(self.restaurant_list());

                // set navbar template to restaurant list
                self.selected_view("restaurants");
                
                // auto scroll to top of navbar
                $("#navbar-scroll-div").scrollTop(0);
                
            }
        });

    };

    // toggle restaurant favorite setting
    self.toggle_favorite = function(obj){

        var match =self.get_fav_by_id(obj.id);
        if(!match){
            self.favorites.push(obj);
        }
        else{
            self.favorites.remove(match);
        }

        obj.favorite(!obj.favorite());
        
        var store_favs = [];
        ko.utils.arrayForEach(self.favorites(), function(item) {
            store_favs.push(item.serialize());
        });

        localStorage.setItem("favorites", JSON.stringify(store_favs));
        console.log(JSON.parse(localStorage.getItem("favorites")));
    };

    // restaurant navbar list item click handler
    self.restaurant_clicked = function(element){
        show_restaurant_window(element);
    };

    // favorites tab toggle button click handler
    self.fav_click = function(element){

        // toggle favorite shown value
        self.fav_shown(!self.fav_shown());
        $("#favorites").slideToggle();

        // reset map markers and show favorite markers if favorite list is visible
        clear_markers();
        if(self.fav_shown()){
            add_markers(self.favorites());
        }
        else {
            add_markers(self.restaurant_list());
        }
    };

    // show categories
    self.show_cat = function(){
        self.restaurant_list.removeAll();
        clear_markers();
        add_markers(self.restaurant_list());
        self.selected_view("categories");
    };

    // favorite menu toggle icon
    self.fav_menu_icon = ko.pureComputed(function(){
        return self.fav_shown() ? "fa fa-angle-double-up fa-2x" : "fa fa-angle-double-down fa-2x"
    }, self);
    
};

// at app start, retrieve list of available categories
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

        ko.applyBindings(new ViewModel(categories));
    }
});




