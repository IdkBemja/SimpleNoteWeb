import { get_username } from "./panel-sync.js";
import { get_last_note } from "./notes-system.js";

$(document).ready(function() {
    login_system();
    register_system();
    logout_system();
    hide_mainpages();

    $(".register-system").hide();
    $("#app").hide();

    $('.register-system').hide();

    $('#register').click(function() {
        $(".login-system").hide();
        $(".register-system").show();
    });

    $('#login').click(function() {
        $(".login-system").show();
        $(".register-system").hide();
    });
});


let newUserId;
let userId = null;

export function setUserId(newUserId){
    userId = newUserId;
}

export function getUserId(){
    return userId;
}

function login_system() {
    let attempts = 0;
    var maxattempts = 3;

    $('#login-btn-submit').click(function() {
        if(attempts >= maxattempts) {
            $(".alert").html("Max attempts reached, please wait and try later.")
            document.getElementById('login-btn-submit').disabled = true;
            setTimeout(function(){
                document.getElementById('login-btn-submit').disabled = false;
                attempts = 0;
            }, 30000);
        }

        var username = $('input[name=login-username]').val();
        var password = $('input[name=login-password').val();

        function showError(message) {
            $(".alert").hide().html(message).show();
        }

        function hideError(){
            $(".alert").hide().empty();
        }
            
        if (!username) {
            showError("El nombre de usuario no puede estar vacío.");
            return;
        }
        if (!password) {
            showError("La contraseña no puede estar vacía.");
            return;
        }

        hideError()

        var data = {
            'username' : username,
            'password' : password
        };

        $.ajax({
            url: '/login',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            dataType: 'json',
            success: function(response) {
                if (response.successful === "Log in successful" && response.user_id) {
                    setUserId(response.user_id);
                    $("#login-panel").hide();
                    get_username(getUserId());
                    get_last_note(getUserId());
                    $("#app").show();
                    
                    mainpage_app();
                } else {
                    $(".alert").hide();
                    $(".alert").html("Unknown Status");
                    $(".alert").show();
                    console.log("Unknown Status");
                    attempts++;
                }
            },
            
            
            error: function(error) {
                console.error(error);
            }
        });
})};


function register_system() {
    let attempts = 0;
    var maxattempts = 3;

    $('#register-btn-submit').click(function() {
        if(attempts >= maxattempts) {
            $(".alert").html("Max attempts reached, please wait and try later.")
            document.getElementById('register-btn-submit').disabled = true;
            setTimeout(function(){
                document.getElementById('register-btn-submit').disabled = false;
                attempts = 0;
            }, 30000);
        }
            var username = $('input[name=register-username]').val();
            var password = $('input[name=register-password]').val();
            var password2 = $('input[name=register-password2]').val();

            function showError(message) {
                $(".alert").hide().html(message).show();
            }
    
            function hideError(){
                $(".alert").hide().empty();
            }
                
            if (!username) {
                showError("The username cannot be empty.");
                return;
            }
            if (!password) {
                showError("The password cannot be empty.");
                return;
            }
            if (!password2) {
                showError("The password cannot be empty.");
                return;
            }

            hideError()

        if (password !== password2) {
            setTimeout(function(){
                showError("The passwords doesn't match, try again.");
            },3000);
            hideError()
        } 

        var data = {
            'username' : username,
            'password' : password,
            'password2' : password2
        };

        $.ajax({
            url: '/register',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            dataType: 'json',
            success: function(response) {
                let messageMap = {
                    "successful": "Log in successful.",
                    "error": "User not found.",
                    "not_password": "Passwords doesn't match."
                };
                if (response.status !== "success") {
                    $(".alert").hide();
                    $(".alert").html(messageMap[response.status])
                    $(".alert").show();
                    console.log(messageMap[response.status] || "Unknown Status");
                    intentos++;
                };
                console.log(messageMap[response.status] || "Unknown Status"); 
                
                if(response.status == "success"){
                    $("#register-system").hide();
                    $("#login-system").show();
                    $(".alert").hide();
                    $(".alert-success").html("Now you can login")
                    $(".alert-success").show();
                }
            },
            error: function(error) {
                console.error(error);
            }
        });
})};

function logout_system() {
    $('#logout').click(function() {
        userId = null;

        localStorage.removeItem('userId');

        $("#app").hide();
        $("#login-panel").show();
})};

function mainpage_app() {
    $(".panel-home").show();
    $(".panel-mynotes").hide();
    $(".panel-archivednotes").hide();
    $('.panel-addnote').hide();
}

export function hide_mainpages(){
    $(".panel-home").hide();
    $(".panel-mynotes").hide();
    $(".panel-archivednotes").hide();
    $('.panel-addnote').hide();
    $('.panel-editnote').hide();
}