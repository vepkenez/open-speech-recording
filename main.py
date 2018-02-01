from flask import Flask, send_file
from flask import abort
from flask import make_response
from flask import redirect
from flask import render_template
from flask import request
from flask import session
from werkzeug.utils import secure_filename
import os
import re
import uuid
import shutil
app = Flask(__name__)

@app.route("/")
def welcome():
    print ("ok")
    session_id = request.cookies.get('session_id')
    if session_id:
        all_done = request.cookies.get('all_done')
        if all_done:
            response = make_response(redirect('/start'))
            response.set_cookie('session_id', '', expires=0)
            return response
        else:
            return render_template("record.html")
    else:
        return make_response(redirect('/start'))

@app.route('/download')
def download():
    name = request.args.get('name')
    if re.search('\W', name):
        return make_response('evil names not allowed', 401)

    target_path = os.path.join(os.path.dirname('__file__'), 'recordings', name)
    if not os.path.exists(target_path):
        return make_response('no recordings for name: %s'%name, 400)
    
    zip_path = os.path.join(os.path.dirname('__file__'), 'zips')
    os.makedirs(zip_path, exist_ok=True)

    zip_file_path = os.path.join(zip_path, name+'.zip')
    if os.path.exists(zip_file_path):
        os.remove(zip_file_path)

    zipfile = shutil.make_archive(
        os.path.join(zip_path, name), 
        'zip', 
        target_path
    )
    return send_file(zipfile, attachment_filename='%s-trainingdata.zip'%name,  as_attachment=True)

@app.route("/start")
def start():
    response = make_response(redirect('/'))
    session_id = uuid.uuid4().hex
    response.set_cookie('session_id', session_id)
    response.set_cookie('all_done', '', expires=0)
    return response

@app.route('/upload', methods=['POST'])
def upload():
    session_id = request.cookies.get('session_id')
    if not session_id:
        make_response('No session', 400)
    word = request.args.get('word')
    if re.search('\W', word.replace('-', '')):
        return make_response('evil words not allowed', 401)
    name = request.args.get('name')
    if re.search('\W', name):
        return make_response('evil names not allowed', 401)

    audio_data = request.data
    filename = word + '----' + uuid.uuid4().hex + '.wav'
    secure_name = filename

    outpath = os.path.join(os.path.dirname('__file__'), 'recordings', name)
    os.makedirs(outpath, exist_ok=True)

    with open(os.path.join('recordings', name, secure_name), 'wb') as f:
       f.write(audio_data)
 
    response = make_response('All good')
    return response

# CSRF protection, see http://flask.pocoo.org/snippets/3/.
@app.before_request
def csrf_protect():
    if request.method == "POST":
        token = session['_csrf_token']
        if not token or token != request.args.get('_csrf_token'):
            abort(403)

def generate_csrf_token():
    if '_csrf_token' not in session:
        session['_csrf_token'] = uuid.uuid4().hex
    return session['_csrf_token']

app.jinja_env.globals['csrf_token'] = generate_csrf_token
# Change this to your own number before you deploy.
app.secret_key = "bibblebabbleblubberdooodle"

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, port=5000, ssl_context='adhoc')
