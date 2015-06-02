#  WAITING FOR THE BUS

`waiting-for-the-bus-server`  provides some methods to query for agencies, routes, stops and times. It also has spatial queries to find nearby stops, routes and agencies.

There is a [companion](https://apps.getpebble.com/en_US/application/55670cbc1034b064db000005) app developed for Pebble Smartwatch that uses the APIs provided by this server. You can find this project [here](https://github.com/dadewash/waiting-for-the-bus-pebble).

## Setup
1. Create an account on [heroku](https://www.heroku.com) and make sure to have a mongoDB database (e.g. [mongolab](https://www.mongolab.com)).
2. Set the the environment variable on heroku containing the database string connection.
`MONGODB_URL='mongodb://user:password@host:port/dbname'`.
3. Clone the application from github: `git clone https://github.com/dadewash/waiting-for-the-bus-server.git`.
4. Install the [heroku toolbelt](https://toolbelt.heroku.com), `cd` into the project and create the remote app:
`heroku apps:create app_name`.
6. Push the application to heroku:
`git push heroku master`

##Initializing the database

Before you can use waiting-for-the-bus you must specify agency. You must upload the GTFS data onto the db. In order to do this see: [gtfs_updater](https://github.com/dadewash/gtfs-updater) that is an application that upload and upgrade automatically the GTFS for this server.
