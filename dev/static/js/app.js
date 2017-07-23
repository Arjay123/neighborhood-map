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
    self.fav_shown = false;

    // console.log(Object.keys(self.categories));
    self.category_list = ko.observableArray(Object.keys(self.categories));

    console.log(self.category_list());

    self.toggleNavbar = function(){
        $("#navbar").toggle("slide", 300);
    };

    self.cat_clicked = function(element){
        console.log(element);
        console.log(self.categories[element]);

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

                    self.restaurant_list.push(restaurant);
                };
                console.log(self.restaurant_list());
                self.selected_view("restaurants");
                
                $("#navbar-scroll-div").scrollTop(0);
                
            }
        });
    };

    self.remove_favorite = function(item){
        self.favorites.remove(item);
        
    };

    self.add_favorite = function(obj, event){

        var index = -1;
        for(var i in self.favorites()){

            if(self.favorites()[i].id.valueOf() === obj.id.valueOf()){
                index = i;
                break;
            }
        }

        if(index > -1){

            $(event.target).animate({
                color: "#EAFCF3"
            }, 200);

            self.favorites.splice(index, 1);
        }
        else {

            $(event.target).animate({
                color: "red"
            }, 200);

            self.favorites.push(obj);
        }
        
    };

    self.restaurant_clicked = function(element){
        console.log(element);
    };

    self.get_star_img = function(rating){
        console.log(rating);
        return "{{url_for('static', filename='img/small_1.png')}}";
    };

    self.fav_click = function(element){

        $("#favorites").slideToggle();
        if(!self.fav_shown)
            $('#drop-icon').addClass('fa-angle-double-up').removeClass('fa-angle-double-down');
        else
            $('#drop-icon').addClass('fa-angle-double-down').removeClass('fa-angle-double-up');
        // if(self.fav_shown){

        //     $("#navbar-half").css("height", "100%");
        //     $("#favorites").css("height", "0%");
        //     $("#favorites").css("display", "none");
        //     $("#navbar-half").css("display", "block");
        // }
        // else {

        //     $("#navbar-half").css("height", "0%");
        //     $("#favorites").css("height", "100%");
        //     $("#favorites").css("display", "block");
        //     $("#navbar-half").css("display", "none");
        // }

        self.fav_shown = !self.fav_shown;
        
    };

    
};

// ko.applyBindings(new ViewModel());



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