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

    this.get_rating_template = function(){
        return "rating_" + self.rating;
    };

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

Restaurant.deserialize = function(obj){
    return new Restaurant(obj.name, obj.price, obj.category, obj.rating, obj.review_ct, obj.img, obj.coordinates, obj.url, obj.id, obj.favorite);
};



function ViewModel(categories){
    var self = this;
    self.categories = categories;
    self.restaurant_list = ko.observableArray();
    self.favorites = ko.observableArray();
    self.selected_view = ko.observable("categories");
    self.fav_shown = ko.observable(false);
    self.page = 0;
    self.list_per_page = 10;
    self.current_category = null;
    self.total_current_restaurants = 0;
    self.prev_available = ko.observable(false);
    self.next_available = ko.observable(false);
    self.error_msg = ko.observable("");

    

    // console.log(Object.keys(self.categories));
    self.category_list = ko.observableArray(Object.keys(self.categories));

    var prev_favs = JSON.parse(localStorage.getItem("favorites"));
    for(var i in prev_favs){
        self.favorites.push(Restaurant.deserialize(prev_favs[i]));
    }

    self.toggleNavbar = function(){
        $("#navbar").toggle("slide", 300, resize_map);
    };

    self.get_fav_by_id = function(id){

        return ko.utils.arrayFirst(self.favorites(), function(item){
            console.log(id.valueOf() + " - " + item.id.valueOf());
            console.log(id.valueOf() === item.id.valueOf());
            return id.valueOf() === item.id.valueOf();
        });
    };

    self.set_prev_available = function(){
        self.prev_available(self.page != 0);
    };

    self.set_next_available = function(){
        self.next_available((self.page * self.list_per_page) < self.total_current_restaurants);
    };

    self.get_next_listings = function(){

        var offset = ++self.page * self.list_per_page;
        self.yelp_ajax(self.current_category, offset);
    };

    self.get_prev_listings = function(){

        var offset = --self.page * self.list_per_page;
        self.yelp_ajax(self.current_category, offset);
    };

    self.cat_clicked = function(element){

        self.page = 0;
        self.current_category = self.categories[element];
        self.yelp_ajax(self.current_category, 0);

    };

    self.yelp_ajax = function(category, offset){

        
        self.restaurant_list.removeAll();
        $.ajax("/yelp?category=" + category + "&offset=" + offset, {
            success: function(response, status, test){

                response = $.parseJSON(response);

                if(response["status"] != 200){
                    self.error_msg("Error " + response["status"] + ": " + response["data"]);
                    self.selected_view("error");
                    return;
                }

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

                    var match = self.get_fav_by_id(restaurant.id);
                    if (!match){
                        console.log("not pushing " + restaurant.id);
                        self.restaurant_list.push(restaurant);
                    }
                    else {
                        console.log("pushing " + match.id);
                        console.log("favorite");
                        console.log(match.favorite());
                        self.restaurant_list.push(match);
                    }
                    
                };

                clear_markers();
                add_markers(self.restaurant_list());

                self.selected_view("restaurants");
                
                $("#navbar-scroll-div").scrollTop(0);
                
            }
        });

    };

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

    self.restaurant_clicked = function(element){
        show_restaurant_window(element);
    };


    self.fav_click = function(element){

        self.fav_shown(!self.fav_shown());
        $("#favorites").slideToggle();
        clear_markers();
        if(self.fav_shown()){
            add_markers(self.favorites());
        }
        else {
            add_markers(self.restaurant_list());
        }
        
        
    };

    self.show_cat = function(){
        self.restaurant_list.removeAll();
        clear_markers();
        add_markers(self.restaurant_list());
        self.selected_view("categories");
    };

    self.animate_marker = function(item){
        console.log(item);
    };

    self.unanimate_marker = function(item){
        console.log(item);
    };

    self.fav_menu_icon = ko.pureComputed(function(){
        return self.fav_shown() ? "fa fa-angle-double-up fa-2x" : "fa fa-angle-double-down fa-2x"
    }, self);
    
};


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




