// ----------
//  Camera
// ----------
var width = 320;    // We will scale the photo width to this
var height = 0;     // This will be computed based on the input stream

var streaming = false;

var video = null;
var canvas = null;
var photo = null;
var capture = null;

function startup() {

    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    photo = document.getElementById('img');
    capture = document.getElementById('capture');

    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(function(stream) {
            video.srcObject = stream;
            video.play();
        })
        .catch(function(err) {
            console.log("An error occured! " + err);
        });

    video.addEventListener('canplay', function(ev){
          if (!streaming) {
            height = video.videoHeight / (video.videoWidth/width);
          
            video.setAttribute('width', width);
            video.setAttribute('height', height);
            canvas.setAttribute('width', width);
            canvas.setAttribute('height', height);
            streaming = true;
          }
        }, false);

    capture.addEventListener('click', function(ev){
          takepicture();
          ev.preventDefault();
        }, false);

    clearphoto();
}

function clearphoto() {
    var context = canvas.getContext('2d');
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);

    var data = canvas.toDataURL('image/png');
    $('#canvas').css({'display': 'none'});
    photo.setAttribute('src', data);
  }

function takepicture() {
    var context = canvas.getContext('2d');
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);

      $('#canvas').css({
        'width': 'auto', 
        'height': '100%',
        'display': 'block'
        });

      $('#capture').css({'display': 'none'});

      var data = canvas.toDataURL('image/png');
      photo.setAttribute('src', data);
      // document.querySelector('#capture').href = data;
      console.log("Photo URL: " + photo.src);
      sendMessage(photo.src, 'detect_objects');
    }
  }

startup();

var cameraMode = false;
$('#cameraModeButton').click(function(ev){
      if(!cameraMode){
        $('#cameraMode').css({'display': 'block'});
        cameraMode = true;
      }else{
        $('#cameraMode').css({'display': 'none'});
        cameraMode = false;
      }
});

// ----------
//  Speech
// ----------

function voiceStartCallback() {
    updateStatus("talking");
}
 
function voiceEndCallback() {
    updateStatus("inactive");
}

var speech_parameters = {
    onend: voiceEndCallback
}

var speak = function(new_message){
    voiceStartCallback();
    responsiveVoice.speak(new_message, "UK English Male", speech_parameters);
}

// ----------
//  Visuals
// ----------

var updateUserMessage = function(new_message){
    console.log("User message: " + new_message);
    $("#visitor_message").text(new_message);
}

var updateAIMessage = function(new_message){
    console.log("AI message: " + new_message);
    $("#assistant_message").text(new_message);
}

// States
var inactive = $SCRIPT_ROOT + "/static/images/microphone.png";
var listening = $SCRIPT_ROOT + "/static/images/microphone-1.png";
var thinking = $SCRIPT_ROOT + "/static/images/settings.png";
var talking = $SCRIPT_ROOT + "/static/images/speakers.png";
var glasses = $SCRIPT_ROOT + "/static/images/eyeglasses.png";

var current_status = "inactive";
var updateStatus = function(status){
    $("#inactiveStatus img").attr("src", inactive);
    $('#activeStatus').css({'animation': 'none'});
    $("#activeStatus").attr("src", glasses);

    if(status == "talking"){
        $("#activeStatus").attr("src", talking);
    }
    else if(status == "thinking"){
        $('#inactiveStatus').css({'display': 'none'});
        $('#activeStatus').css({'animation': '2s rotate360 infinite linear'});
        $("#activeStatus").attr("src", thinking);
    }
    else if(status == "listening"){
        $("#inactiveStatus img").attr("src", listening);
    }
    else{
        $('#inactiveStatus').css({'display':'block'});
    }
    current_status = status;
    console.log("Status: " + status);
}

$('#img').click(function(){
    $(this).css({'display': 'none'});
    $('#video').css({'display': 'block'});
});

updateStatus(current_status);

// ----------------
//  Communication
// ----------------

var previous_response = ""
var sendMessage = function(message, type){
    if (!message) return;
    
    console.log(message);
    if (type == 'communication'){
        updateUserMessage(message);
    }
    
    updateStatus("thinking");
    var url = $SCRIPT_ROOT + "/_" + type;
    $.getJSON(url, {
        text: message,
      }, function(data) {
        console.log("Response: " + data.assistant_message);
        if(data.assistant_message == " - "){
            updateStatus("inactive");
            return;
        }
        updateAIMessage(data.assistant_message);
        speak(data.assistant_message);
        if(type == 'detect_objects'){
            $('#video').css({'display': 'none'});
            $('#canvas').css({'display': 'none'});
            $('#capture').css({'display': 'block'});
            var d = new Date();
            photo.setAttribute('src', $SCRIPT_ROOT + 'static/images/output.png?' + d.getTime());
            $('#img').css({'display': 'block'});
        }
        previous_response = data.assistant_message;
      });
}

$('input').keypress(function (e) {
      if (e.which == 13) {
            event.preventDefault();
            text_input = $(this).val();
            $(this).val("");
            //sendMessage(text_input, 'communication');
            sendMessage(text_input, "conversation");
      }
});

// -------------
// Google STT 
// -------------

var recognition = new webkitSpeechRecognition();
recognition.continuous = false;
recognition.interimResults = true;
recognition.lang = "en-US";
recognition.onresult = function(event) { 
    var interim_transcript = '';
    for (var i = event.resultIndex; i < event.results.length; ++i) {
        console.log(event.results[i]);
        if (event.results[i].isFinal) {
            var final_transcript = event.results[i][0].transcript;
            final_transcript = capitalizeFirstLetter(final_transcript);
            updateUserMessage(final_transcript);
            //sendMessage(final_transcript, "communication");
            sendMessage(final_transcript, "conversation");
        } else {
            interim_transcript += event.results[i][0].transcript;
            interim_transcript = capitalizeFirstLetter(interim_transcript);
            updateUserMessage(interim_transcript);
        }
    }
}

var record = function() {
    if(current_status == "listening"){
        updateStatus("inactive");
        recognition.stop();
    }else{
        updateStatus("listening");
        recognition.start();
    }
}

/*$("#testConversation").click(function(){
    console.log('clicked test');
    sendMessage('painting1', 'conversation_handler');
});*/


// -------------
// Other
// -------------

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

console.log("Loaded main.js");

