# Webannotation API
Stores the annotated data from the watche(s) at the no-sql mongodb database.

## API authentication
To access the api there is an authentication process. To specify the authentication data, the valid username and password the needs to be hard coded in a file called "secrets.js" in folder "config". The notation of this file __needs to be__ in the following style:

```javascript
module.exports = {
    'APIUSER': 'TypeUsernameHere',
    'APIACCESS': 'TypeAPIAccessPasswordHere'
};
```

__Note:__ The *secrets.js* file is not part of this repo. After cloning the repository you have to create the file in the *config* folder and paste your own authentication code in form of the example code shown above. Otherwise you will alwas get authentication errors while transmitting data to the server.<br/>
<br/>
*It is highly recommended to use a authentication and do not let the api routes be unprotected!*

## Database
In this version the MongoDB database runs locally on the server so there is no direct access to the database via http requests or something else. The webservers backend connects to the database server so webserver and database server __has__ to run on the same machine.

### Database settings
The annotation data is stored in the MongoDB database with the:<br/>
<br/>
__Database-Name:__ *nativeannodb* <br/>
__Database-Collection:__ *nativeannotateddatasets*
<br/>
<br/>
*This settings are declared in the files __DataModels.js__ and __database.js__* so update explaination here if changes to this files occurred!