#  WAITING FOR THE BUS

`waiting-for-the-bus-server`  provides some methods to query for agencies, routes, stops and times. It also has spatial queries to find nearby stops, routes and agencies.

There is a [companion](https://apps.getpebble.com/en_US/application/55670cbc1034b064db000005) app developed for Pebble Smartwatch that uses the APIs provided by this server. You can find this project [here](https://github.com/dadewash/waiting-for-the-bus-pebble).

## Setup
1. create an account on [heroku](https://www.heroku.com) and on mongoDB (e.g. [mongolab](https://www.mongolab.com)).
2. set the URI on the heroku that permits the communications between the app and  the database.
3. install the [heroku toolbelt](https://toolbelt.heroku.com), and create the app following the guideline.
4. clone the application from github: `git clone https://github.com/dadewash/waiting-for-the-bus-server.git`.
5. configure the loading data
6. now you can push the application on heroku:
 

`git push heroku master`


##Configuration for loading data

Before you can use waiting-for-the-bus you must specify agency. You need to configure [gtfs_updater](https://github.com/dadewash/gtfs-updater) that is an application that upload and upgrade automatically the GTFS for this server.
