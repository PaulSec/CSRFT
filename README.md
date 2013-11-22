CSRFT - Cross Site Request Forgeries (Exploitation) Toolkit

This project has been developed for exploiting CSRF Web vulnerabilities and provide you a quick and easy exploitation toolkit. 

This project allows you to perform PoC (Proof Of Concepts) really easily. <br />
For launching the project, you just need to do : 

<code>node server.js <conf file> <port, default: 8080></code>

The server will be launched on the port 8080, so you can access it via : <code>http://0.0.0.0:8080 </code>.  
The file.json must be in the conf/ folder and describe your several attack scenarios. 

The index page displayed on the browser is accessible via : <code>/views/index.ejs</code>. <br />
You can change it as you want and give the link to your victim. 

* Conf folder : add your audit.json file with your configuration. <br />
* Exploits folder : add all your *.html files containing your forms (use form_creator or form_dumper if needed (See GitHub account : PaulSec)) <br />
* public folder : containing js folder, jquery and inject.js (script loaded when accessing 0.0.0.0:8888)
* views folder : index file and exploit template
* server.js file - the HTTP server

### Use case : 

If you want to perform a simple & fast exploitation of CSRF vulnerabilities, here are the steps to reproduce : 

1) Create your configuration file, see samples in conf/ folder<br />
2) Add your *.html files in the exploits/ folder with the different payloads if the CSRF is POST vulnerable<br />
3) If you want to do Dictionnary attack, add your dictionnary file to the dicos/ folder,<br />
4) Replace the value of the field you want to perform this attack with the token '<%value%>' (without the single quote)<br />
      => either in your urls if GET exploitation, or in the HTML files if POST exploitation. <br />
5) Launch the application !<br />
