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

updateStatus(current_status);

// ----------------
//  Communication
// ----------------

var previous_response = ""
var sendMessage = function(message){
    if (!message) return;
    console.log(message);
    updateUserMessage(message);
    updateStatus("thinking");
    var url = $SCRIPT_ROOT + "/_communication";
    $.getJSON(url, {
        text: message,
      }, function(data) {
        console.log("Response: " + data.assistant_message);
        if(data.assistant_message == " - "){
            updateStatus("inactive");
            return;
        }
        if(data.assistant_message != previous_response){
            updateAIMessage(data.assistant_message);
            speak(data.assistant_message);
        }else{
            updateStatus("inactive");
        }
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


// -------------
// Other
// -------------

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

console.log("Loaded main.js");

