/* eslint-disable */
$(function () {
    var socket = io();
    var state = 'chat';

    // Immediately set focus on username entry.
    // $('#login-input-textbox').focus();

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
    var devCycleQ = $('#temp-dev-next');
    var highScores = $('#high-scores')

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
        // chatInput.focus();
        socket.emit('get-new-question');
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
    
    socket.on('new-highscore', function(hs){
        console.log("New highscore.");
        highScores.html(''); 
        for(var x=0;x<hs.length;x++){
            highScores.append(
            $("<li><span style=\"color:"+hs[x].color+"\">"+ hs[x].name+"</span>: "+hs[x].score+"</li>"));
        }
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
        var a = q.answers;
        updateTrivia(q.question, a.a, a.b, a.c, a.d);
        console.log(q);
    });
    
    triviaA.click(function(){answerClick(triviaA,'A')});
    triviaB.click(function(){answerClick(triviaB,'B')});
    triviaC.click(function(){answerClick(triviaC,'C')});
    triviaD.click(function(){answerClick(triviaD,'D')});
    
    socket.on('trivia-over', function(score){
        console.log("Trivia over.");
        updateTrivia(score);
        devCycleQ.attr('style','display:none;');
        hideTriviaButtons();
        $('#highscores').attr('style','display:block;');
    });
    
    function answerClick(button, answer){
        socket.emit('submit-answer', answer);
        button.blur();
    }
    
    function updateTrivia(q,a,b,c,d){
        triviaQuestion.html(q);
        triviaA.html(a);
        triviaB.html(b);
        triviaC.html(c);
        triviaD.html(d);
    }

    function hideTriviaButtons(){
        triviaA.attr('style','display:none;');
        triviaB.attr('style','display:none;');
        triviaC.attr('style','display:none;');
        triviaD.attr('style','display:none;');
    }
});