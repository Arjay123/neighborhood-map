## neighborhood-map

A website that allows users to browse through all restaurants for a certain city, using data supplied by Yelp and Google Maps.


## Install

It is highly recommended to create a virtualenv for your python libraries. For more information on virtualenv please visit: https://virtualenv.pypa.io/en/stable/, but for a quick reference you can install virtualenv using pip:
```
pip install virtualenv
```

Once virtualenv is installed you can create a virtual environment using the command:
```
virtualenv NAME_OF_YOUR_VIRTUAL_ENVIRONMENT
```

This will create a virtualenv directory in your current directory. You can then activate your virtualenv using the command:
```
source NAME_OF_YOUR_VIRTUAL_ENVIRONMENT/bin/activate
```

You can then install all required python packages using the included requirements.txt file
```
pip install -r requirements.txt
```

This project also includes a gulp build process to create a production ready version of the source code. Usage of gulp requires node.js: https://nodejs.org/en/

Once node.js is installed, you can install all required gulp packages using the package.json file with the command:
```
npm install
```

You can then create a production ready version of the source code using gulp:
```
gulp
```

## Usage

This project requires Yelp API access. You can get your own credentials here: https://www.yelp.com/fusion.

Once you have your credentials, you'll need to create a yelp_auth.json file in the same path as the app.py file. The structure of this file is as follows:
```
{
    "CLIENT_ID": "XXXXX",
    "CLIENT_SECRET": "XXXXX",
    "API_KEY": "XXXXX"
}
```
Once you have created this file, the project can be run by running the app.py file.
```
python app.py
```

On first usage, the application starts with a few restaurants already added to the favorites list to demonstrate the favorites list feature.

By default the application only searches for restaurants in San Jose, CA, but this can be customized by changing the location in yelp_api() in the app.py file. Note that if you do this you should also change the starting location of the google map object in map.js.