import json

from flask import Flask
from flask import render_template
from flask import url_for

app = Flask(__name__)

YELP_CLIENT_ID = json.loads(
    open("yelp_auth.json", "r").read())["CLIENT_ID"]
YELP_CLIENT_SECRET = json.loads(
    open("yelp_auth.json", "r").read())["CLIENT_SECRET"]


@app.route("/")
def index():
    print (YELP_CLIENT_ID)
    print (YELP_CLIENT_SECRET)
    return render_template("index.html")


if __name__ == "__main__":
    app.run()