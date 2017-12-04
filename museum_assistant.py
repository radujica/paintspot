from flask import Flask, render_template, jsonify, request, url_for
import logging

app = Flask(__name__)

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

class MuseumAssistant():
    def __init__(self): pass


    def get_response(self, message):
        return "I don't understand."



assistant = MuseumAssistant()


# Generate the landing page
@app.route("/")
def index():
    return render_template('index.html')

# Receives the user input => generates response
@app.route('/_communication', methods= ['GET'])
def handle_text_input():
    input_text = request.args.get('text_input', 0, type=str)
    print ("User message: %s"  % input_text)
    response = assistant.get_response(input_text)
    print ("Assistant response: %s" % response)
    return jsonify(assistant_message=response)

if __name__ == "__main__":
    # Set host address so that the server is accessible network wide
    #app.run(host='0.0.0.0', port="5050")
    app.run(port="5050")