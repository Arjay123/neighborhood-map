// Restaurant object containing data from yelp's api service
//
// name - name of restaurant
// price - price of restaurant according to yelp's $ rating
// category - type of restaurant
// reviewCt - number of reviews
// img - url of restaurant image
// coordinates - obj containing lat/lng of restaurant
// url - yelp url for restaurant
// id - restaurant id
// favorite - bool value whether restaurant has been favorited by the user
//
function Restaurant(name, price, category, rating, reviewCt, img, coordinates, url, id, favorite=false){
    let self = this;

    this.name = name;
    this.price = price;
    this.category = category;
    this.rating = rating;
    this.reviewCt = reviewCt;
    this.img = img;
    this.coordinates = coordinates;
    this.url = url;
    this.id = id;
    this.favorite = ko.observable(favorite);
    this.visible = ko.observable(true);

    // get ko template name of yelp's star rating imgs
    this.getRatingTemplate = function(){
        return 'rating_' + self.rating;
    };

    // return restaurant as a json object
    this.serialize = function(){
        return {
            'name': self.name,
            'price': self.price,
            'category': self.category,
            'rating': self.rating,
            'reviewCt': self.reviewCt,
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
                          obj.reviewCt,
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

    let self = this;

    self.categories = categories; // list of categories
    self.restaurantList = ko.observableArray(); // current list of restaurants to be displayed in navbar list
    self.favorites = ko.observableArray(); // list of user's favorite restaurants
    self.selectedView = ko.observable('categories'); // current selected view template
    self.favShown = ko.observable(false); // whether the user has selected to display their favorite restaurants over search results
    self.page = 0; // page number of results, used w/ listPerPage to create an offset for getting other results
    self.listPerPage = 10; // num of restaurant results to get per request
    self.currentCategory = null; // currently selected restaurant type
    self.totalCurrentRestaurants = 0; // total restaurants of current selected category
    self.prevAvailable = ko.observable(false); // whether there are restaurants before the current list to retrieve
    self.nextAvailable = ko.observable(false); // whether there are restaurants after the current list to retrieve
    self.errorMsg = ko.observable(''); // error message in case of yelp api request failures
    self.categoryList = ko.observableArray(Object.keys(self.categories)); // list of categories
    self.options = ko.observableArray(['Price Filter', // list of filter options
                                       '$',
                                       '$$',
                                       '$$$',
                                       '$$$$']);
    self.selectedOption = ko.observable(self.options()[0].val); // current selected filter option




    // toggle navbar visibility, only available for viewports of ipad or smaller
    self.toggleNavbar = function(){
        $('#navbar').toggle('slide', 300, resizeMap);
    };

    // check if restaurant one of user's favorites
    self.getFavByID = function(id){

        return ko.utils.arrayFirst(self.favorites(), function(item){
            return id.valueOf() === item.id.valueOf();
        });

    };

    // set whether previous results are available
    self.setPrevAvailable = function(){
        self.prevAvailable(self.page !== 0);
    };

    // set whether more results are available
    self.setNextAvailable = function(){
        self.nextAvailable((self.page * self.listPerPage) < self.totalCurrentRestaurants);
    };

    // get next listings from yelp api
    self.getNextListings = function(){

        let offset = ++self.page * self.listPerPage;
        self.yelpAjax(self.currentCategory, offset);

    };

    // get previous lists from yelp api
    self.getPrevListings = function(){

        let offset = --self.page * self.listPerPage;
        self.yelpAjax(self.currentCategory, offset);

    };

    // category clicked event handler, call yelp api service to retrieve restaurants
    self.catClicked = function(element){

        if(self.favShown()){
            self.favClick();
        }

        self.page = 0;
        self.currentCategory = element;
        self.yelpAjax(self.currentCategory, 0, self.selectedOption());

    };

    // retrieve restaurant results based on category and offset
    self.yelpAjax = function(category, offset){

        // clear current restaurant list
        self.restaurantList.removeAll();
        category = self.categories[category];
        let url = '/yelp?category=' + category + '&offset=' + offset;


        $.ajax(url, {
            success: function(response, status, test){

                response = $.parseJSON(response);

                // if request fail, display error message instead
                if(response.status != 200){
                    self.errorMsg('Error ' + response.status + ': ' + response.data);
                    self.selectedView('error');
                    return;
                }

                // store new restaurant results and display in navbar
                data = $.parseJSON(response.data);
                self.totalCurrentRestaurants = data.total;
                self.setNextAvailable();
                self.setPrevAvailable();
                data.businesses.forEach(function(curr){

                    let restaurant = new Restaurant(curr.name,
                                                    curr.price,
                                                    curr.categories[0].title,
                                                    curr.rating,
                                                    curr.reviewCt,
                                                    curr.image_url,
                                                    curr.coordinates,
                                                    curr.url,
                                                    curr.id);

                    // if restaurant is in user favorites, use that restaurant object instead
                    let match = self.getFavByID(restaurant.id);
                    if (!match){
                        self.restaurantList.push(restaurant);
                    }
                    else {
                        self.restaurantList.push(match);
                    }
                });

                // display markers for restaurant in google map
                clearMarkers();
                addMarkers(self.restaurantList());
                self.set_visible(self.selectedOption());
                // set navbar template to restaurant list
                self.selectedView('restaurants');

                // auto scroll to top of navbar
                $('#navbar-scroll-div').scrollTop(0);

            },
            error: function(jqXHR, textStatus, errorThrown){
                alert('Not able to retrieve restaurants from Yelp API');
            }

        });

    };

    // toggle restaurant favorite setting
    self.toggleFavorite = function(obj){

        let match =self.getFavByID(obj.id);
        if(!match){
            self.favorites.push(obj);
        }
        else{
            self.favorites.remove(match);
        }

        obj.favorite(!obj.favorite());

        let storeFavs = [];
        ko.utils.arrayForEach(self.favorites(), function(item){
            storeFavs.push(item.serialize());
        });

        localStorage.setItem('favorites', JSON.stringify(storeFavs));
    };

    // restaurant navbar list item click handler
    self.restaurantClicked = function(element){
        showRestaurantWindow(element);
    };

    // favorites tab toggle button click handler
    self.favClick = function(element){

        // toggle favorite shown value
        self.favShown(!self.favShown());
        $('#favorites').slideToggle();

        // reset map markers and show favorite markers if favorite list is visible
        clearMarkers();
        if(self.favShown()){
            addMarkers(self.favorites());
        }
        else {
            addMarkers(self.restaurantList());
        }
    };

    // show categories
    self.showCat = function(){
        self.restaurantList.removeAll();
        clearMarkers();
        addMarkers(self.restaurantList());
        self.selectedOption(self.options()[0]);
        self.selectedView('categories');
    };


    // favorite menu toggle icon
    self.favMenuIcon = ko.pureComputed(function(){
        return self.favShown() ? 'fa fa-angle-double-up fa-2x' : 'fa fa-angle-double-down fa-2x';
    }, self);

    // load users favorite restaurants from local storage
    let addFav = function(fav){
        self.favorites.push(Restaurant.deserialize(fav));
    };

    // load favorites from localstore or default json file
    let loadFavs = function(){
        let prevFavs = JSON.parse(localStorage.getItem('favorites'));
        if(prevFavs){
            prevFavs.forEach(addFav);
            favs_deferred.resolve();
        }
        else {
            // get default favorites from json file if first time user
            $.ajax('/defaults', {
                success: function(data, status){
                    favs = $.parseJSON(data);
                    favs.forEach(addFav);
                },
                error: function(data, status){
                    alert('Could not retrieve default favorites');
                },
                complete: function(){
                    favs_deferred.resolve();
                }
            });
        }
    }

    // load favorites once google maps api is loaded
    deferred.done(function(){
        loadFavs();
    });

    // show favorites by default once favorites and google maps api are loaded
    favs_deferred.done(function(){
        self.favClick();
    });

    // selected filter has been changed
    self.selectedOption.subscribe(function(data){
        self.set_visible(data);
    });

    // set restaurants as visible based on current price filter
    self.set_visible = function(option){
        self.restaurantList().forEach(function(restaurant){
            restaurant.visible(restaurant.price === option || option === self.options()[0]);
        });
    }

    // get count of visible restaurants
    self.visible_any = ko.computed(function(){

        // prevent error msg from appearing while loading restaurants
        if(self.restaurantList().length == 0)
            return true;

        let visible = false;
        self.restaurantList().forEach(function(restaurant){
            if(restaurant.visible()){
                visible = true;
                return;
            }
        });
        return visible;
    });
}

let favs_deferred = $.Deferred();

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




