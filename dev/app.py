import json
import requests

from flask import Flask
from flask import render_template
from flask import url_for
from flask import request
from flask import send_file

app = Flask(__name__)

YELP_CLIENT_ID = json.loads(open("yelp_auth.json", "r")
    .read())["CLIENT_ID"]
YELP_CLIENT_SECRET = json.loads(open("yelp_auth.json", "r")
    .read())["CLIENT_SECRET"]
YELP_API_KEY = json.loads(open("yelp_auth.json", "r")
    .read())["API_KEY"]


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/yelp")
def yelp_api():

    category = request.args.get('category', None)

    print(category)
    print("testing")
    print("")
    print("")

    if not category:
        return "No category selected"

    endpoint = "https://api.yelp.com/v3/businesses/search"
    query = "limit=10&location=San Jose&categories=%s" % str(category)

    r = requests.get(endpoint + "?" + query, 
        headers={'Authorization': 'bearer %s' % YELP_API_KEY})
    print("test")

    return r.text


@app.route("/img/<filename>")
def get_img(filename):
    pass

@app.route("/categories")
def get_yelp_food_categories():
    return open("yelp_categories.json").read()
    # categories = {}
    # cat_json = json.loads(open("yelp_categories.json").read())

    # for item in cat_json:
    #     if "food" in item["parents"]:
    #         add = True

    #         if "country_whitelist" in item:
    #             if "US" not in item["country_whitelist"]:
    #                 add = False

    #         if "country_blacklist" in item:
    #             if "US" in item["country_blacklist"]:
    #                 add = False

    #         if add:
    #             categories[item["title"]] = item["alias"]

    # return categories




if __name__ == "__main__":
    app.run()