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
var monkey_img_mobile = $SCRIPT_ROOT + "/static/images/monkey_mobile.jpg";
$("#monkeyImg").attr("src", monkey_img_mobile);





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
    resetCameraMode();
});

var resetCameraMode = function() {
    // Reset to default
    $('#cameraMode').css({'display': 'none'});
    $('#video').css({'display': 'block'});
    $('#img').css({'display': 'none'});
    cameraMode = false;
}

$('#monkeyImg').click(function() {
    resetCameraDemo();
});

var resetCameraDemo = function() {
    $('#cameraDemo').css({'display': 'none'});
    // Reset to default
    $('#demoImg').css({
        'display': 'block',
        'left': '-30%',
        'transform': 'scale(1) translateY(-50%)',
    });
    $('#paintspot').css({'color': 'rgb(200, 200, 200)'});
    $('#monkeyImg').css({'display': 'none'});
    // $("#monkeyImg").attr("src", monkey_img);
    $("#monkeyImg").attr("src", monkey_img_mobile);
    cameraDemo = false;
}

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
            document.getElementById('monkeyImg').setAttribute('src', $SCRIPT_ROOT + 'static/images/monkey_output.png?' + d.getTime());
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

// ---------------
// Speech-to-text 
// ---------------

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
        resetCameraMode();
        cameraMode = false;
    }
});

// DEMO OF CAMERA FEATURE
var cameraDemo = false;
$('#cameraModeButtonDemo').click(function(ev){
    $('#cameraMode').css({'display': 'none'});
    $('#cameraModeDemo').css({'display': 'none'});

    if(!cameraDemo){
        cameraDemo = true;
        $('#cameraDemo').css({'display': 'block'});

        $('#paintspot').css({'color': 'white'});

        setTimeout(function() {
            // Pan to lower left corner (monkey's position)
            $('#demoImg').css({
                'left': '320%',
                'transform': 'scale(5) translateY(-50%)'
            });
        }, 1000);

        setTimeout(function() {
            sendObjectDetectionMessage('static/images/monkey_mobile.jpg', 'monkey');
            $('#demoImg').css({'display': 'none'});
            $('#monkeyImg').css({'display': 'block'});
        }, 2000);

    }else{
        resetCameraDemo();
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

