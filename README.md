Note-taking system - Final version
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

3. Edit ``callbackURL`` in ``config/auth.json``, if you just test in localhost , use this code : 

        "callbackURL" : "http://localhost:8080/auth/google/callback"

    Or change it with your website's domain : 

        "callbackURL" : "http://<your_domain>/auth/google/callback"

4. Start this application : 

    $ npm start


Demo
-------

To be continued...

Old version (No screen broadcast) : https://ncnu-nts.herokuapp.com/

LICENCE
------------

To be continued...