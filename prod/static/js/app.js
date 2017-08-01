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
    let self = this;

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
        return 'rating_' + self.rating;
    };

    // return restaurant as a json object
    this.serialize = function(){
        return {
            'name': self.name,
            'price': self.price,
            'category': self.category,
            'rating': self.rating,
            'review_ct': self.review_ct,
            'img': self.img,
            'coordinates': self.coordinates,
            'url': self.url,
            'id': self.id,
            'favorite': self.favorite()
        };
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


const default_favs = [{
    'name': 'La Costa',
    'price': '$',
    'category': 'Mexican',
    'rating': 4,
    'review_ct': 734,
    'img': 'https://s3-media1.fl.yelpcdn.com/bphoto/Y1D6LpW6JtkzhSBPEI3iCg/o.jpg',
    'coordinates': {
      'latitude': 37.35413,
      'longitude': -121.85363
    },
    'url': 'https://www.yelp.com/biz/la-costa-san-jose-2?adjust_creative=kPuE2LrVTUv5F9…api_v3&utm_medium=api_v3_business_search&utm_source=kPuE2LrVTUv5F9bQgA6JkA',
    'id': 'la-costa-san-jose-2',
    'favorite': true
  },
  {
    'name': 'i-Tea',
    'price': '$',
    'category': 'Bubble Tea',
    'rating': 4.5,
    'review_ct': 242,
    'img': 'https://s3-media2.fl.yelpcdn.com/bphoto/Nhc9VcNEILbO6uXjGquo7g/o.jpg',
    'coordinates': {
      'latitude': 37.312231523169,
      'longitude': -121.809779829623
    },
    'url': 'https://www.yelp.com/biz/i-tea-san-jose?adjust_creative=kPuE2LrVTUv5F9bQgA6…api_v3&utm_medium=api_v3_business_search&utm_source=kPuE2LrVTUv5F9bQgA6JkA',
    'id': 'i-tea-san-jose',
    'favorite': true
  },
  {
    'name': 'Rangoli India Restaurant',
    'price': '$$',
    'category': 'Indian',
    'rating': 3.5,
    'review_ct': 1001,
    'img': 'https://s3-media2.fl.yelpcdn.com/bphoto/CCvYbOFGvPdS4gtqOjty7g/o.jpg',
    'coordinates': {
      'latitude': 37.2605099,
      'longitude': -121.93186
    },
    'url': 'https://www.yelp.com/biz/rangoli-india-restaurant-san-jose?adjust_creative=…api_v3&utm_medium=api_v3_business_search&utm_source=kPuE2LrVTUv5F9bQgA6JkA',
    'id': 'rangoli-india-restaurant-san-jose',
    'favorite': true
  },
  {
    'name': 'Pho Y #1',
    'price': '$',
    'category': 'Vietnamese',
    'rating': 4,
    'review_ct': 1058,
    'img': 'https://s3-media1.fl.yelpcdn.com/bphoto/RgC-icTIQWN2l3qeCrjx-Q/o.jpg',
    'coordinates': {
      'latitude': 37.306181,
      'longitude': -121.81068
    },
    'url': 'https://www.yelp.com/biz/pho-y-1-san-jose?adjust_creative=kPuE2LrVTUv5F9bQg…api_v3&utm_medium=api_v3_business_search&utm_source=kPuE2LrVTUv5F9bQgA6JkA',
    'id': 'pho-y-1-san-jose',
    'favorite': true
  },
  {
    'name': 'Milohas',
    'price': '$',
    'category': 'Bakeries',
    'rating': 4.5,
    'review_ct': 415,
    'img': 'https://s3-media2.fl.yelpcdn.com/bphoto/8-pmaw3IAnxAuehCv4JL-g/o.jpg',
    'coordinates': {
      'latitude': 37.2556595,
      'longitude': -121.8970034
    },
    'url': 'https://www.yelp.com/biz/milohas-san-jose?adjust_creative=kPuE2LrVTUv5F9bQg…api_v3&utm_medium=api_v3_business_search&utm_source=kPuE2LrVTUv5F9bQgA6JkA',
    'id': 'milohas-san-jose',
    'favorite': true
  }
];

// ko viewmodel
//
// params:
//      categories - list of food categories from yelp's api service
//
function ViewModel(categories){

    let self = this;

    self.categories = categories; // list of categories
    self.restaurant_list = ko.observableArray(); // current list of restaurants to be displayed in navbar list
    self.favorites = ko.observableArray(); // list of user's favorite restaurants
    self.selected_view = ko.observable('categories'); // current selected view template
    self.fav_shown = ko.observable(false); // whether the user has selected to display their favorite restaurants over search results
    self.page = 0; // page number of results, used w/ list_per_page to create an offset for getting other results
    self.list_per_page = 10; // num of restaurant results to get per request
    self.current_category = null; // currently selected restaurant type
    self.total_current_restaurants = 0; // total restaurants of current selected category
    self.prev_available = ko.observable(false); // whether there are restaurants before the current list to retrieve
    self.next_available = ko.observable(false); // whether there are restaurants after the current list to retrieve
    self.error_msg = ko.observable(''); // error message in case of yelp api request failures
    self.category_list = ko.observableArray(Object.keys(self.categories)); // list of categories
    self.options = ko.observableArray([{text: 'Price Filter', val: 0}, // list of filter options
                                       {text: '$', val: 1},
                                       {text: '$$', val: 2},
                                       {text: '$$$', val: 3},
                                       {text: '$$$$', val: 4}]);
    self.selected_option = ko.observable(self.options()[0].val); // current selected filter option

    // load users favorite restaurants from local storage
    let add_fav = function(fav){
        self.favorites.push(Restaurant.deserialize(fav));
    };

    let prev_favs = JSON.parse(localStorage.getItem('favorites'));
    if(prev_favs)
        prev_favs.forEach(add_fav);
    else
        default_favs.forEach(add_fav);

    // if first time use, insert default favorites to showcase feature


    // toggle navbar visibility, only available for viewports of ipad or smaller
    self.toggleNavbar = function(){
        $('#navbar').toggle('slide', 300, resize_map);
    };

    // check if restaurant one of user's favorites
    self.get_fav_by_id = function(id){

        return ko.utils.arrayFirst(self.favorites(), function(item){
            return id.valueOf() === item.id.valueOf();
        });

    };

    // set whether previous results are available
    self.set_prev_available = function(){
        self.prev_available(self.page !== 0);
    };

    // set whether more results are available
    self.set_next_available = function(){
        self.next_available((self.page * self.list_per_page) < self.total_current_restaurants);
    };

    // get next listings from yelp api
    self.get_next_listings = function(){

        let offset = ++self.page * self.list_per_page;
        self.yelp_ajax(self.current_category, offset);
        self.yelp_ajax(self.current_category, offset, self.selected_option());

    };

    // get previous lists from yelp api
    self.get_prev_listings = function(){

        let offset = --self.page * self.list_per_page;
        self.yelp_ajax(self.current_category, offset, self.selected_option());

    };

    // category clicked event handler, call yelp api service to retrieve restaurants
    self.cat_clicked = function(element){

        if(self.fav_shown()){
            self.fav_click();
        }

        self.page = 0;
        self.current_category = element;
        self.yelp_ajax(self.current_category, 0, self.selected_option());

    };

    // retrieve restaurant results based on category and offset
    self.yelp_ajax = function(category, offset, price=0){

        // clear current restaurant list
        self.restaurant_list.removeAll();
        category = self.categories[category];
        let url = '/yelp?category=' + category + '&offset=' + offset;

        if(price)
            url += '&price=' + price;

        $.ajax(url, {
            success: function(response, status, test){

                response = $.parseJSON(response);

                // if request fail, display error message instead
                if(response.status != 200){
                    self.error_msg('Error ' + response.status + ': ' + response.data);
                    self.selected_view('error');
                    return;
                }

                // store new restaurant results and display in navbar
                data = $.parseJSON(response.data);
                self.total_current_restaurants = data.total;
                self.set_next_available();
                self.set_prev_available();
                data.businesses.forEach(function(curr){
                    let restaurant = new Restaurant(curr.name,
                                                    curr.price,
                                                    curr.categories[0].title,
                                                    curr.rating,
                                                    curr.review_count,
                                                    curr.image_url,
                                                    curr.coordinates,
                                                    curr.url,
                                                    curr.id);

                    // if restaurant is in user favorites, use that restaurant object instead
                    let match = self.get_fav_by_id(restaurant.id);
                    if (!match){
                        self.restaurant_list.push(restaurant);
                    }
                    else {
                        self.restaurant_list.push(match);
                    }
                });

                // display markers for restaurant in google map
                clear_markers();
                add_markers(self.restaurant_list());

                // set navbar template to restaurant list
                self.selected_view('restaurants');

                // auto scroll to top of navbar
                $('#navbar-scroll-div').scrollTop(0);

            },
            error: function(jqXHR, textStatus, errorThrown){
                alert('Not able to retrieve restaurants from Yelp API');
            }

        });

    };

    // toggle restaurant favorite setting
    self.toggle_favorite = function(obj){

        let match =self.get_fav_by_id(obj.id);
        if(!match){
            self.favorites.push(obj);
        }
        else{
            self.favorites.remove(match);
        }

        obj.favorite(!obj.favorite());

        let store_favs = [];
        ko.utils.arrayForEach(self.favorites(), function(item){
            store_favs.push(item.serialize());
        });

        localStorage.setItem('favorites', JSON.stringify(store_favs));
    };

    // restaurant navbar list item click handler
    self.restaurant_clicked = function(element){
        show_restaurant_window(element);
    };

    // favorites tab toggle button click handler
    self.fav_click = function(element){

        // toggle favorite shown value
        self.fav_shown(!self.fav_shown());
        $('#favorites').slideToggle();

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
        self.selected_view('categories');
    };


    // favorite menu toggle icon
    self.fav_menu_icon = ko.pureComputed(function(){
        return self.fav_shown() ? 'fa fa-angle-double-up fa-2x' : 'fa fa-angle-double-down fa-2x';
    }, self);

    // show favorites by default once google maps api is loaded
    deferred.done(function(){
        self.fav_click();
    });


    self.selected_option.subscribe(function(data){
        self.selected_option(data);
        self.page = 0;
        self.yelp_ajax(self.current_category, self.page, self.selected_option());
    });
}



// at app start, retrieve list of available categories
$.ajax('/categories', {
    success: function(data, status){
        cats = $.parseJSON(data);
        categories = {};

        cats.forEach(function(item){
            if ($.inArray('food', item.parents) != -1 ||
                $.inArray('restaurants', item.parents) != -1){

                let add = true;

                if ('country_whitelist' in item)
                    if ($.inArray('US', item.country_whitelist) == -1)
                        add = false;

                if ('country_blacklist' in item)
                    if ($.inArray('US', item.country_blacklist) != -1)
                        add = false;

                if (add)
                    categories[item.title] = item.alias;
            }
        });

        ko.applyBindings(new ViewModel(categories));
    },
    error: function(jqXHR, textStatus, errorThrown){
        alert('Not able to retrieve restaurants from Yelp API');
    }
});




