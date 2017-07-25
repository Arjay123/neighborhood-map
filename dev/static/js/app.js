function Restaurant(name, price, category, rating, review_ct, img, location, url, id){
    var self = this;

    this.name = name;
    this.price = price;
    this.category = category;
    this.rating = rating;
    this.review_ct = review_ct;
    this.img = img;
    this.location = location;
    this.url = url;
    this.id = id;
    this.favorite = ko.observable(false);

    this.get_rating_template = function(){
        return "rating_" + self.rating;
    };

}



function ViewModel(categories){
    var self = this;
    self.categories = categories;
    self.restaurant_list = ko.observableArray();
    self.favorites = ko.observableArray();
    self.selected_view = ko.observable("categories");
    self.fav_shown = ko.observable(false);

    // console.log(Object.keys(self.categories));
    self.category_list = ko.observableArray(Object.keys(self.categories));

    console.log(self.category_list());

    self.toggleNavbar = function(){
        $("#navbar").toggle("slide", 300);
    };

    self.get_fav_by_id = function(id){
        return ko.utils.arrayFirst(self.favorites(), function(item){
            return id === item.id;
        });
    };

    self.cat_clicked = function(element){
        console.log(element);
        console.log(self.categories[element]);
        self.restaurant_list.removeAll();

        $.ajax("/yelp?category=" + self.categories[element], {
            success: function(response, status, test){
                console.log(response);
                response = $.parseJSON(response);
                for(index in response["businesses"]){
                    var curr = response["businesses"][index]
                    var restaurant = new Restaurant(curr["name"], 
                                                    curr["price"],
                                                    curr["categories"][0]["title"],
                                                    curr["rating"],
                                                    curr["review_count"],
                                                    curr["image_url"],
                                                    curr["location"],
                                                    curr["url"],
                                                    curr["id"]);

                    var match = self.get_fav_by_id(restaurant.id);
                    if (!match){
                        self.restaurant_list.push(restaurant);
                    }
                    else {
                        self.restaurant_list.push(match);
                    }
                    
                };
                console.log(self.restaurant_list());
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

        console.log(self.favorites());
        obj.favorite(!obj.favorite());
        
    };

    self.restaurant_clicked = function(element){
        console.log(element);
    };


    self.fav_click = function(element){

        $("#favorites").slideToggle();
        self.fav_shown(!self.fav_shown());
        
    };

    self.show_cat = function(){
        self.selected_view("categories");
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
