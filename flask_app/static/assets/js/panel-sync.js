import { getUserId } from './auth-system.js';
import { hide_mainpages } from './auth-system.js';
import { load_active_notes } from './notes-system.js';
import { load_archived_notes } from './notes-system.js';
import { get_last_note } from './notes-system.js';

var username;

$(document).ready(function() {
    $('#panel-home').click(function() {
        hide_mainpages();
        welcome_username(getUserId());
        get_last_note(getUserId());
        $(".panel-home").show();
    });

    $('#panel-mynotes').click(function() {
    hide_mainpages();
    get_username(getUserId(), function(username) {
        load_active_notes(username);
        $(".panel-mynotes").show();
        });
    });

    $('#panel-archivednotes').click(function() {
        hide_mainpages();
        get_username(getUserId(), function(username){
            load_archived_notes(username);
        $(".panel-archivednotes").show();
        })
    });

    $('#panel-addnotes').click(function() {
        hide_mainpages();
        $(".panel-addnote").show();
    });

    $('#create-note').click(function(){
        hide_mainpages();
        $(".panel-addnote").show();
    })

});

export function get_username(userId, callback){
    if (userId !== null) {
        $.ajax({
            url: '/api/get_user/' + userId,
            type: 'GET',
            success: function(response){
                if(response && response.username){ 
                    callback(response.username);
                } else {
                    console.log(response)
                }
            },
            error: function(error) {
                console.error(error);
            }
        });
    }
}


export function welcome_username(userId){
    if (userId !== null){
        var welcomeMessage = document.getElementById('welcome-message');
        $.ajax({
            url: '/api/get_user/' + userId,
            type: 'GET',
            success: function(response){
                username = response.username;
                welcomeMessage.textContent = 'Welcome back, ' + response.username;
            },
            error: function(error) {
                console.error(error);
            }
        });
    }
}

