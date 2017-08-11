import json
import requests

from flask import Flask
from flask import render_template
from flask import url_for
from flask import request
from flask import send_file

app = Flask(__name__)

# Retrieve yelp authorizations from yelp_auth json file
YELP_CLIENT_ID = json.loads(open('yelp_auth.json', 'r')
    .read())['CLIENT_ID']
YELP_CLIENT_SECRET = json.loads(open('yelp_auth.json', 'r')
    .read())['CLIENT_SECRET']
YELP_API_KEY = json.loads(open('yelp_auth.json', 'r')
    .read())['API_KEY']


"""
Homepage
"""
@app.route('/')
def index():
    return render_template('index.html')


"""
Local endpoint for requesting yelp api data

Yelp has disable CORS so yelp api calls must be called from the server, not the
client

Params:
    category - category of restaurant type to retrieve
    offset - restaurant number offset
"""
@app.route('/yelp')
def yelp_api():

    category = request.args.get('category', None)
    offset = request.args.get('offset', None)
    price = request.args.get('price', None)

    if not category:
        return json.dumps({
                'status': 404,
                'data': 'No category requested'
            })

    endpoint = 'https://api.yelp.com/v3/businesses/search'
    query = 'limit=10&location=San Jose&categories=%s&offset=%s' \
            % (category, offset)

    if price:
        query += '&price=%s' % price

    r = requests.get(endpoint + '?' + query,
        headers={'Authorization': 'bearer %s' % YELP_API_KEY})

    response = {
        'status': 200,
        'data': r.text
    }

    if(r.status_code != 200):
        response = {
            'status': r.status_code,
            'data': 'Could not retrieve restaurants from Yelp'
        }

    return json.dumps(response)


"""
Local endpoint for requesting data from yelp's api business endpoint

Retrieves more detailed information about a restaurant
(i.e. hours of operation, phone number, etc)

Params:
    business_id - id of restaurant to retrieve
"""
@app.route('/yelp_business')
def get_business():
    business_id = request.args.get('id', None)

    if not business_id:
        return json.dumps({
                'status': 404,
                'data': 'No business id specified'
            })

    endpoint = 'https://api.yelp.com/v3/businesses/'
    query = endpoint + business_id

    r = requests.get(query,
            headers={'Authorization': 'bearer %s' %YELP_API_KEY})

    response = {
        'status': 200,
        'data': r.text
    }

    if(r.status_code != 200):
        response = {
            'status': r.status_code,
            'data': 'Could not retrieve restaurant info from yelp'
        }

    return json.dumps(response)

@app.route('/defaults')
def get_default_favs():
    return open('fav_defaults.json').read()

"""
Local endpoint for retrieving stored category json file
"""
@app.route('/categories')
def get_yelp_food_categories():

    # TODO - check if category json file exists first

    return open('yelp_categories.json').read()


if __name__ == '__main__':
    app.jinja_env.auto_reload = True
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    app.run(debug=True, host='0.0.0.0')
