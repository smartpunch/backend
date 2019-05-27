# Webannotation and classification API
Stores the annotated data from the Watche(s) at the no-sql mongodb database and starts a trainings classification.

## Getting started

### 1. Create the configuration files
Navigate into the folder `config` and create four files with extactly the following names:
<ul>
<li><code>database.js</code></li>
<li><code>secrets.js</code></li>
<li><code>pythonconfig.js</code></li>
<li><code>stats_data_pathes.js</code></li>
</ul>

### 1.A: Database configuration file `database.js`
In this version the MongoDB database runs locally on the server so there is no direct access to the database via http requests or something else. The webservers backend connects to the database server so webserver and database server __has__ to run on the same machine.
#### Database settings
The annotation data is stored in the MongoDB database with the:<br/>
<br/>
__Database-Name:__ *nativeannodb* <br/>
__Database-Collection:__ *nativeannotateddatasets*
<br/>
<br/>
*This settings are declared in the files __DataModels.js__ and __database.js__* so update explaination here if changes to this files occurred!

__Paste the following code snippet in your database.js file and edit the secret and database name to your needs__:
```javascript
module.exports = {
  'secret': 'meansecure',
  'database': 'mongodb://localhost/nativeannodb'
};
```

<hr>

### 1.B API authentication file `secrets.js`
To access the api there is an authentication process. To specify the authentication data, the valid username and password the needs to be hard coded in the file called `secrets.js` in folder `config`.<br>
__Paste the following code snippet in your secrets.js file and edit the username and password to your ones__:

```javascript
module.exports = {
    'APIUSER': 'TypeUsernameHere',
    'APIACCESS': 'TypeAPIAccessPasswordHere'
};
```
__Note:__ The *secrets.js* file is not part of this repo. After cloning the repository you have to create the file in the *config* folder and paste your own authentication code in form of the example code shown above. Otherwise you will alwas get authentication errors while transmitting data to the server.<br/>
<br/>
*It is highly recommended to use a authentication and do not let the api routes be unprotected!*

<hr>

### 1.C Python path configuration file `pythonconfig.js`
To start a live classification the live classification script path needs to be declared. Also the path to the python excecutable needs to be defined in the `pythonconfig.js` file.
<br>

__Paste the following code snippet in your pythonconfig.js file and edit the path of the live_classification script and the path of the python executable to your needs__:

```javascript
// Script paths and python executable
module.exports = {
    'scriptPath': 'C:/path-to-the-file/live_classification.py',
    'pythonExecutable':'C:/path-to-your/Python37/python.exe'
};
```
<hr>

### 1.D Pathes of the model stats and punch data files `stats_data_pathes.js.js`
To start a live classification the live classification script path needs to be declared. Also the path to the python excecutable needs to be defined in the `pythonconfig.js` file.
<br>

__Paste the following code snippet in your stats_data_pathes.js file and edit the path of the files needed for the system to store the data in__:

```javascript
// Paths to the stats and punch data files
module.exports = {
    'punch_data_path': 'C:/path-to-the-file/punch_data.json',
    'clear_punch_recognition_stats_path': 'C:/path-to-the-file/clear_punch_stats.json',
    'punch_recognition_stats_path': 'C:/path-to-the-file/punch_stats.json'
};
```
__Important: Make shure to create the following files under the path you defined above:__
<ul>
<li>punch_data.json</li>
<li>clear_punch_stats.json</li>
<li>punch_stats.json</li>
</ul>

__Copy the content below in the `punch_data.json` file:__
```javascript
{}
```

__Copy the content below in the `punch_stats.json` AND the `clear_punch_stats` file:__
```javascript
{
    "absoluteFailWinSums": [
        {
            "hands": [
                [
                    0,
                    0
                ],
                [
                    0,
                    0
                ]
            ]
        },
        {
            "hands": [
                [
                    0,
                    0
                ],
                [
                    0,
                    0
                ]
            ]
        },
        {
            "hands": [
                [
                    0,
                    0
                ],
                [
                    0,
                    0
                ]
            ]
        },
        {
            "hands": [
                [
                    0,
                    0
                ],
                [
                    0,
                    0
                ]
            ]
        }
    ],
    "absoluteHandOnlyFailsSums": [
        0,
        0
    ],
    "absolutePunchTypeOnlyFailsSums": [
        0,
        0,
        0,
        0
    ],
    "absoluteHandOnlyWinsSums": [
        0,
        0
    ],
    "absolutePunchTypeOnlyWinsSums": [
        0,
        0,
        0,
        0
    ],
    "absolutePositiveAccuracy": 0,
    "absoluteNegativeAccuracy": 0,
    "relativeAccuracy": 0
}
```

### 2. Start the server
__First: The MongoDB database server has to run to start the webserver. So please make shure to start your MongoDB database server first.__<br>
After the database server is running, in the main project root enter the following line in the cli and press enter to start the server:
```
node ./bin/www
````
*Note: If you don't want to use a database server you have to uncomment the following lines in the ```app.js``` file to avoid the error message of the missing database server instance when starting the webserver:*
```javascript
/**
 * Try to connect to database
 * Uncomment the block below if you dont have
 * a database server running at the moment
 */
 /*
mongoose.connect(config.database, { promiseLibrary: require('bluebird') })
  .then(() => console.log('connection succesful'))
  .catch((err) => {
    console.error(err.message);
    console.log("Error while connection to database. Exit process!");
    process.exit(0);
  }
  );
  */
```
**It is highly recommended to use a MongoDB database server to use the annotation functionalities of the smartwatch app.**