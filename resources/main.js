$(function () {
    var socket = io();

    $('#login-form').submit(function(){
      var elem = $('#login-input-textbox');
      socket.emit('login', elem.val());
      elem.val('');
      return false;
    });

    socket.on('logged-in', function(u){
        $('#login').attr('style','display:none;');
        $('#chat-input-textbox').attr('placeholder',"Send a message...");
        $('#chat').attr('style','display:block;');
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

  });