from flask import Flask, render_template, jsonify, request, url_for
from scipy.misc import imread, imresize
import matplotlib.pyplot as plt
import io, base64
from PIL import Image
import logging, time
from object_detector import ObjectDetector
from conversation_handler import ConversationHandler

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
conversation_handler = ConversationHandler()

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
    # Handle inputs
    data = request.args.get('img', 0, type=str)
    label = request.args.get('label', 0, type=str)
    print ("Provided image data: %s"  % data)

    # Convert to image
    if '.png' in data or '.jpg' in data:
        img = Image.open(data) # For demo
    else:
        img = Image.open(io.BytesIO(base64.b64decode(data.split(',')[1]))) # For camera

    # 1: Demo case
    if label == 'monkey':
        time.sleep(2)
        response = conversation_handler.reply_to_app(reply='monkey')
    else:
        objects = object_detector.detect_objects(img, label)
        # 2: Object was found
        if label in objects:
            response = "You found the %s!" % label
        # 3: Object was not found
        else:
            response = "No %s found in the image." % label
    print ("Assistant response: %s" % response)
    return jsonify(assistant_message=response)


@app.route('/_conversation', methods=['GET'])
def handle_conversation():
    text = request.args.get('text', 0, type=str)
    if "thanks" in text.lower():
        response = "You're welcome!"
    else:
        response = conversation_handler.reply_to_app(reply=text)
    return jsonify(assistant_message=response)


if __name__ == "__main__":
    # Set host address so that the server is accessible network wide
    # app.run(host='0.0.0.0', port="5050")
    app.run(port="5050")
