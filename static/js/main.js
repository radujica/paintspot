// ----------
//  Speech
// ----------

function voiceStartCallback() {
    updateStatus("talking");
}
 
function voiceEndCallback() {
    updateStatus("inactive");

    // If the read message was information about existing applications
    // toggle animation of link to website with information about applications
    if (prev_message.includes('application')){
        $('#mh_link').bind("animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd", function(){
            $(this).removeClass("pop_animation");
        }).addClass("pop_animation");
    }

}

var speech_parameters = {
    onend: voiceEndCallback
}

var prev_message = "";
var speak = function(new_message){
    voiceStartCallback();
    responsiveVoice.speak(new_message, "UK English Male", speech_parameters);
    prev_message = new_message;
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

// Images
var camera_img = $SCRIPT_ROOT + "/static/images/camera.png";
$(".cameraButton img").attr("src", camera_img);


var mh_img = $SCRIPT_ROOT + "/static/images/mauritshuis_logo.png";
$("#mh_link img").attr("src", mh_img);

var adam_eve_img = $SCRIPT_ROOT + "/static/images/adam_eve.png";
$("#demoImg").attr("src", adam_eve_img);

var monkey_img = $SCRIPT_ROOT + "/static/images/monkey.jpg";
$("#monkeyImg").attr("src", monkey_img);



// States
var inactive = $SCRIPT_ROOT + "/static/images/microphone.png";
var listening = $SCRIPT_ROOT + "/static/images/microphone-1.png";
var thinking = $SCRIPT_ROOT + "/static/images/settings.png";
var talking = $SCRIPT_ROOT + "/static/images/speakers.png";

var current_status = "inactive";
var updateStatus = function(status){
    $("#inactiveStatus img").attr("src", inactive);
    $('#activeStatus').css({'animation': 'none'});
    $("#activeStatus").attr("src", inactive);

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
    // Reset to default
    $('#cameraMode').css({'display': 'none'});
    cameraMode = false;
});

$('#monkeyImg').click(function(){
    // Reset to default
    $('#demoImg').css({
        'display': 'block',
        'transform': 'translate3d(0,0,0)',
        'position': 'absolute',
        'bottom': '0',
        'left': '0',
        'width': '100%',
        'height': 'auto',
        'transition': 'all 1s ease',
    });
    $('#monkeyImg').css({'display': 'none'});
    $('#cameraDemo').css({'display': 'none'});
    $("#monkeyImg").attr("src", monkey_img);

    cameraDemo = false;
});

updateStatus(current_status);

// ----------------
//  Communication
// ----------------

var sendObjectDetectionMessage = function(img_data, label){    
    console.log(img_data);

    updateStatus("thinking");
    var url = $SCRIPT_ROOT + "/_detect_objects";
    $.getJSON(url, {
        img: img_data,
        label: label
      }, function(data) {
        console.log("Response: " + data.assistant_message);
        if(data.assistant_message == " - "){
            updateStatus("inactive");
            return;
        }

        // Update visuals to show the image with object detections
        var d = new Date();
        if(label == 'monkey'){
            document.getElementById('monkeyImg').setAttribute('src', $SCRIPT_ROOT + 'static/images/output.png?' + d.getTime());
        }else{
            $('#img').css({'display': 'block'});
            photo.setAttribute('src', $SCRIPT_ROOT + 'static/images/output.png?' + d.getTime());
            $('#video').css({'display': 'none'});
            $('#canvas').css({'display': 'none'});
            $('.captureButton').css({'display': 'block'});
        }
        updateAIMessage(data.assistant_message);
        speak(data.assistant_message);
        
      });
}

var previous_response = ""
var sendMessage = function(message){
    if (!message) return;
    
    console.log(message);
    updateUserMessage(message);
    
    updateStatus("thinking");
    var url = $SCRIPT_ROOT + "/_conversation";
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
        previous_response = data.assistant_message;
      });
}

$('input').keypress(function (e) {
      if (e.which == 13) {
            event.preventDefault();
            text_input = $(this).val();
            $(this).val("");
            sendMessage(text_input);
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
            sendMessage(final_transcript);
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
// Recreate conversation
// -------------

// timeout seems to be in total time from start
function sendMessageToWatson(textToSend, waitingTime, textToShow) {
    if (textToShow == null) {
        textToShow = textToSend;
    }

    setTimeout(function() {
        updateUserMessage(textToShow);
        sendMessage(textToSend);
    }, waitingTime);
}

// $(document).ready(function() {
//     sendMessageToWatson("aS", 3000, " - ");
//     sendMessageToWatson("Tom", 7000);
//     sendMessageToWatson("Yes", 16000);
//     // can't think of a quick way to remove the aTU-like keywords
//     // without hardcoding the exact questions in Conversation
//     sendMessageToWatson("aTU p1 q1", 23000, " - ");
//     sendMessageToWatson("17th?", 28000);
//     sendMessageToWatson("aTU p1 q2", 34000, " - ");
//     sendMessageToWatson("monkey", 39000, "<image>");    // this is the image recognition
//     sendMessageToWatson("uQ p1 grapes", 46000, "Do the grapes signify anything?");
//     sendMessageToWatson("rA", 52000, " - ");            // this one's funny with the text-to-speech
// });

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
    capture = document.getElementById('captureButtonReal');

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

var label = 'person'
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

      $('.captureButton').css({'display': 'none'});

      var data = canvas.toDataURL('image/png');
      photo.setAttribute('src', data);
      // document.querySelector('#capture').href = data;
      console.log("Photo data: " + photo.src);
      sendObjectDetectionMessage(photo.src, label);
    }
  }

startup();

var cameraMode = false;
$('#cameraModeButton').click(function(ev){
    $('#cameraMode').css({'display': 'none'});
    $('#cameraModeDemo').css({'display': 'none'});

    if(!cameraMode){
        $('#cameraMode').css({'display': 'block'});
        cameraMode = true;
    }else{
        cameraMode = false;
    }
});

// DEMO OF CAMERA FEATURE
var cameraDemo = false;
$('#cameraModeButtonDemo').click(function(ev){
    $('#cameraMode').css({'display': 'none'});
    $('#cameraModeDemo').css({'display': 'none'});

    if(!cameraDemo){
        $('#cameraDemo').css({'display': 'block'});
        cameraDemo = true;

        setTimeout(function() {
            // Pan to lower left corner (monkey's position)
            $('#demoImg').css({
                'left': '-300px',
                'bottom': '0',
                'width': '400%',
            });
        }, 2000);

        setTimeout(function() {
            sendObjectDetectionMessage('static/images/monkey.jpg', 'monkey');
            $('#demoImg').css({'display': 'none'});
            $('#monkeyImg').css({'display': 'block'});
        }, 3000);

    }else{
        cameraDemo = false;
    }
});


// -------------
// Other
// -------------

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

console.log("Loaded main.js");

