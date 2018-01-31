from flask import Flask
from flask import abort
from flask import make_response
from flask import redirect
from flask import render_template
from flask import request
from flask import session
from werkzeug.utils import secure_filename
import os


import os
import uuid

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

@app.route("/legal")
def legal():
    return render_template("legal.html")

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
    audio_data = request.data
    filename = word + '----' + uuid.uuid4().hex + '.wav'
    secure_name = filename
    # Left in for debugging purposes. If you comment this back in, the data
    # will be saved to the local file system.
    with open(os.path.join('recordings', secure_name), 'wb') as f:
       f.write(audio_data)
    # Create a Cloud Storage client.
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
    app.run(debug=True)
