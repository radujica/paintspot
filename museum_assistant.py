from flask import Flask, render_template, jsonify, request, url_for
from scipy.misc import imread, imresize
import io, base64
from PIL import Image
import logging
from object_detector import ObjectDetector

app = Flask(__name__)

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

class MuseumAssistant():
    def __init__(self): pass

    def get_response(self, message):
        if "application" in message:
            return "You can find more information about existing Mauritshuis applications in the link at the \
            top of the application."
        
        return "I'm not hooked up to the Watson Conversation API yet."

    def detect_objects(self, img):
        return "This is an image"


assistant = MuseumAssistant()
object_detector = ObjectDetector()

# Generate the landing page
@app.route("/")
def index():
    return render_template('index.html')

# Receives the user input => generates response
@app.route('/_communication', methods= ['GET'])
def handle_text_input():
    input_text = request.args.get('text', 0, type=str)
    print ("User message: %s"  % input_text)
    response = assistant.get_response(input_text)
    print ("Assistant response: %s" % response)
    return jsonify(assistant_message=response)

# Receives the path to image => detects objects in image
@app.route('/_detect_objects', methods= ['GET'])
def handle_photo_input():
    data = request.args.get('text', 0, type=str)
    img = Image.open(io.BytesIO(base64.b64decode(data.split(',')[1])))
    print ("Provided filepath: %s"  % data)
    objects = object_detector.detect_objects([img])
    #objects = []
    if 'person' in objects:
        response = "Person found."
    else:
        response = "No person found in the image."
    print ("Assistant response: %s" % response)
    return jsonify(assistant_message=response)

if __name__ == "__main__":
    # Set host address so that the server is accessible network wide
    # app.run(host='0.0.0.0', port="5050")
    app.run(port="5050")