/* eslint-disable */
$(function () {
    var socket = io();
    var state = 'chat';

    // Immediately set focus on username entry.
    $('#login-input-textbox').focus();

    /*
     * Page components:
     */
    var switchButton = $('#switch-button');
    var loginPane = $('#login');
    var chatPane = $('#chat');
    var triviaPane = $('#trivia');
    var chatInput = $('#chat-input-textbox');

    //Trivia
    var triviaQuestion = $('#trivia-question');
    var triviaA = $('#trivia-ans-a');
    var triviaB = $('#trivia-ans-b');
    var triviaC = $('#trivia-ans-c');
    var triviaD = $('#trivia-ans-d');

    $('#login-form').submit(function(){
      var elem = $('#login-input-textbox');
      if(elem.val().length>0){
        socket.emit('login', elem.val());
      }else{
        $('#login-input-textbox').attr('placeholder','Minumum one character.');
      }
      elem.val('');
      return false;
    });

    socket.on('logged-in', function(u){
        loginPane.attr('style','display:none;');
        chatInput.attr('placeholder',"Send a message...");
        chatPane.attr('style','display:block;');
        switchButton.attr('style','display:block;');
        chatInput.focus();
    });

    $('#chat-form').submit(function(){
        socket.emit('message', $('#chat-input-textbox').val());
        $('#chat-input-textbox').val('');
        return false;
    });

    socket.on('message out', function(m){
        $('#messages').append(
            $("<li><span style=\"color:"+m.usercolor+"\">"+ m.username+"</span>: "+m.message+"</li>"));
    });

    socket.on('announce', function(m){
        $('#messages').append(
            $("<li>User <span style=\"color:"+m.usercolor+"\">"+ m.username+"</span> "+m.message+"</li>"));
    });


    // Button
    switchButton.click(function(){
        if(state==='chat'){
            state = 'trivia';
            showTrivia();
        }else{
            state = 'chat';
            showChat();
        }
    });

    function showChat(){
        switchButton.html('Trivia');
        chatPane.attr('style','display:block;');
        triviaPane.attr('style','display:none;');

    }

    function showTrivia(){
        switchButton.html('Chat');
        triviaPane.attr('style','display:block;');
        chatPane.attr('style','display:none;');

    }

    // Q and A:

    /*
    var triviaQuestion = $('#trivia-question');
    var triviaA = $('#trivia-ans-a');
    var triviaB = $('#trivia-ans-b');
    var triviaC = $('#trivia-ans-c');
    var triviaD = $('#trivia-ans-d');
    */

    /*
    $('#chat-form').submit(function(){
        socket.emit('message', $('#chat-input-textbox').val());
        $('#chat-input-textbox').val('');
        return false;
    });*/

    socket.on('new-question', function(q){
        console.log("Recieving new question...");
        console.log(q);
    });

    socket.emit('get-new-question');

});