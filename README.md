Note-taking system ( Final version )
======================================

Introduction
------------------

To be continued...


Build
------------

1. Clone and install

        $ git clone https://github.com/alvin9453/NTS_Final.git 
        $ cd ./NTS_Final/
        $ npm install

2. Add a ``ssl`` folder in ``bin`` :

        $ cd bin
        $ mkdir ssl
        $ mv <certificate.crt> <private.key> ssl/

3. Edit ``bin/www``

   If you just build on localhost : 
        
        var isUseHTTPs = false;
        ....
        // var port = 443;  // comment this line
        var port = normalizePort(process.env.PORT || '8080');

   If you deploy this application in https domain : 

        var isUseHTTPs = true;
        ....
        var port = 443;
        // var port = normalizePort(process.env.PORT || '8080'); // comment this line

4. Edit ``callbackURL`` in ``config/auth.json``, if you just test in localhost , use this code : 

        "callbackURL" : "http://localhost:8080/auth/google/callback"

    Or change it with your website's domain : 

        "callbackURL" : "http://<your_domain>/auth/google/callback"

5. Start this application : 

        $ npm start


Then open ``localhost:8080`` or ``https://<your_domain>`` in your browser.


Demo
-------

To be continued...

Old version (No screen broadcast) : https://ncnu-nts.herokuapp.com/

LICENCE
------------

To be continued...