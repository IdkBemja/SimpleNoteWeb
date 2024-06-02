import { getUserId } from './auth-system.js';
import { hide_mainpages } from './auth-system.js';
import { get_username } from './panel-sync.js';

$(document).ready(function() {
    save_note();
    delete_note();
    load_active_notes();
    archive_note();
    unarchive_note();
    edit_note_panel();
    save_note_with_id();
    get_last_note();
});

function save_note() {
    $('#save-new-note').click(function(){
        var notetitle = $('input[name=title-note]').val();
        var notedescription = $('textarea[name=description-note]').val();
        var notecategory = $('select[name=category-note]').val();

        let notetagsinput = $('input[name=tags-note]').val();

        let notetagsarray = notetagsinput.split(', ');

        notetagsarray = notetagsarray.map(tag => tag.trim()).filter(tag => tag.length > 0);

        function showError(message) {
            $(".alert").show().html(message).show();
        }

        function hideError(){
            $(".alert").hide().empty();
        }
        
        if (!notetitle) {
            showError("The title cannot be empty.");
            return;
        }
        if (!notedescription) {
            showError("The description can't be empty.");
            return;
        }
        if (!notecategory) {
            showError("You must select a category.");
            return;
        }
        if (notetagsarray.length === 0) {
            showError("You must add at least one tag.");
            return;
        }

        hideError()

        let userId = getUserId();

        var data = {
            'title' : notetitle,
            'description' : notedescription,
            'status': "active",
            'category' : notecategory,
            'tags' : notetagsarray,
            'user_id' : userId
        };


        $.ajax({
            url: '/notes/add',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            dataType: 'json',
            success: function(response) {
                let messageMap = {
                    "successful" : "Note has been added successfully",
                    "error": "You need to fill in all the necessary fields"
                };
                if (response.successful) {
                    $('.panel-addnote').hide();
                    $('.panel-mynotes').show();
                    load_active_notes();
                    console.log(response); 
                } else {
                    $(".alert").hide();
                    $(".alert").html(messageMap[response.status])
                    $(".alert").show();
                    console.log(messageMap[response.status] || "Unknown Status");
                }
            },
            error: function(error){
                console.error(error);
            }
        });
})};


export function load_active_notes(username) {
    let userId = getUserId();
    var notesActive = $('.my-notes-all');

    if (!userId) {
        console.error('User ID is not set');
        return;
    }

    $.ajax({
        url: '/user/' + userId + '/active_notes',
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            var notesActive = $('.my-notes-all');
            var notesArchived = $('.my-notes-archived');
            notesActive.empty();
            notesArchived.empty();

            if (response.error) {
                console.log(response.error);
                var noteElement = `<h3 class="not-notesfound">You don't have active notes</h3>`;
                notesActive.empty().append(noteElement);
            }

            response.forEach(function(note) {
                var noteElement = `
                    <div class="my-note">
                        <h6 class="show-note-title">${note.title}</h6>
                        <p>${note.description}</p>
                        <div class="note-info">
                            <p>Author: ${username}</p>
                            <p>Date: ${note.updated_at ? note.updated_at : note.created_at}</p>
                        </div>
                        <div class="last-notes-buttons">
                            <input type="hidden" value="${note.id}">
                            <button type="button" class="btn bi-pencil-square" id="edit-note"></button>
                            <button type="button" class="btn bi-archive-fill" id="archive-note"></button>
                            <button type="button" class="btn bi-trash-fill" id="delete-note"></button>
                        </div>
                    </div>`;
                notesActive.append(noteElement);
            });
        },
        error: function(error) {
            console.log(error);
            var noteElement = `<h3 class="not-notesfound">You don't have active notes</h3>`;
            notesActive.empty().append(noteElement);
        }
    });
}

export function load_archived_notes(username) {
    let userId = getUserId();

    var notesArchived = $('.my-notes-archived');

    if (!userId) {
        console.error('User ID is not set');
        return;
    }

    $.ajax({
        url: '/user/' + userId + '/archived_notes',
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            var notesActive = $('.my-notes-all');
            var notesArchived = $('.my-notes-archived');
            notesActive.empty();
            notesArchived.empty();

            if (response.error) {
                console.log(response.error);
                var noteElement = `<h3 class="not-notesfound">You don't have archived notes</h3>`;
                notesArchived.empty().append(noteElement);
            } else {
                response.forEach(function(note) {
                    var noteElement = `
                        <div class="my-note">
                            <h6 class="show-note-title">${note.title}</h6>
                            <p>${note.description}</p>
                            <div class="note-info">
                                <p>Author: ${username}</p>
                                <p>Date: ${note.updated_at}</p>
                            </div>
                            <div class="last-notes-buttons">
                                <input type="hidden" value="${note.id}">
                                <button type="button" class="btn bi-pencil-square"></button>
                                <button type="button" class="btn bi-archive-fill" id="unarchive-note"></button>
                                <button type="button" class="btn bi-trash-fill" id="delete-note"></button>
                            </div>
                        </div>`;
                    notesArchived.append(noteElement);
                });
            }
        },
        error: function(error) {
            console.log(error);
            var noteElement = `<h3 class="not-notesfound">You don't have archived notes</h3>`;
            notesArchived.empty().append(noteElement);
        }
    });
}



function delete_note() {
    $(document).on('click', '#delete-note', function() {
        let userId = getUserId();
        var noteId = $(this).siblings('input[type=hidden]').val();

        var data = {
            'user_id' : userId
        };
        
        $.ajax({
            url: '/notes/remove/' + noteId,
            type: 'DELETE',
            data: JSON.stringify(data),
            contentType: 'application/json',
            dataType: 'json',
            success: function(response) {
                if (response.successful) {
                    console.log(response.successful.message);
                    load_active_notes();
                } else {
                    console.log(response.message);
                }
                
            },
            error: function(error) {
                console.error(error);
            }
        });
    });
}

function archive_note(username) {
    $(document).on('click', '#archive-note', function() {
        let userId = getUserId();
        var noteId = $(this).siblings('input[type=hidden]').val();

        var data = {
            'user_id' : userId,
            'status': "archived"
        };
        
        $.ajax({
            url: '/notes/archive/' + noteId,
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            dataType: 'json',
            success: function(response) {
                if (response[0].successful) {
                    console.log(response);
                    load_active_notes(username);
                } else {
                    console.log(response.message);
                }
            },
            error: function(error) {
                console.error(error);
            }
        });
    });
}

function unarchive_note(username) {
    $(document).on('click', '#unarchive-note', function() {
        let userId = getUserId();
        var noteId = $(this).siblings('input[type=hidden]').val();

        var data = {
            'user_id' : userId,
            'status': "active"
        };
        
        $.ajax({
            url: '/notes/unarchive/' + noteId,
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            dataType: 'json',
            success: function(response) {
                if (response[0].successful) {
                    console.log(response);
                    load_archived_notes(username);
                } else {
                    console.log(response.message);
                }
            },
            error: function(error) {
                console.error(error);
            }
        });
    });
}


export function edit_note_panel() {
    $(document).on('click', '#edit-note', function() {
        hide_mainpages();
        $(".panel-editnote").show();
        let userId = getUserId();
        var noteId = $(this).siblings('input[type=hidden]').val();

    var notesArchived = $('.my-notes-archived');

    if (!userId) {
        console.error('User ID is not set');
        return;
    }

    $.ajax({
        url: '/note/' + noteId+ '?user_id=' + userId,
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            var editNote = $('.panel-editnote');
            editNote.empty();

            if (response.error) {
                console.log(response.error);
                var noteElement = `<h3 class="not-notesfound">You don't have note to edit</h3>`;
                editNote.empty().append(noteElement);
            } else {
                var note = response;
                var noteElement = `
                        <h3>Edit Note</h3>
                        <div class="notes-add-div">
                            <label for="note-title">Title</label>
                            <input type="text" maxlength="20" value="${note.title}" id="note-title" name="title-note-edit" class="note-title">
                        </div>
                        <div class="notes-add-div">
                            <label for="">Description</label>
                            <textarea class="note-description" maxlength="255" name="description-note-edit">${note.description}</textarea>
                        </div>
                        <div class="notes-add-div">
                            <label for="">Tags</label>
                            <input type="text" value="${note.tags}" class="note-tags" name="tags-note-edit">
                        </div>
                        <div>
                            <label for="note-category">Category</label>
                            <select name="category-note" id="note-category" class="note-category">
                                <option ${note.category === 'Work' ? 'selected' : ''}>Work</option>
                                <option ${note.category === 'Study' ? 'selected' : ''}>Study</option>
                                <option ${note.category === 'Ideas' ? 'selected' : ''}>Ideas</option>
                                <option ${note.category === 'Reminders' ? 'selected' : ''}>Reminders</option>
                                <option ${note.category === 'Personal' ? 'selected' : ''}>Personal</option>
                            </select>
                        </div>
                        <input type="hidden" value="${note.id}">
                        <button type="button" class="btn btn-success" id="save-edit-note">Save Note</button>`;
                editNote.append(noteElement);
                save_note_with_id(noteId);
            }
        },
        error: function(error) {
            console.log(error);
            var noteElement = `<h3 class="not-notesfound">You don't have notes</h3>`;
            notesArchived.empty().append(noteElement);
        }
    });
})};

function save_note_with_id(noteId) {
    $('#save-edit-note').click(function() {
        var notetitle = $('input[name=title-note-edit]').val();
        var notedescription = $('textarea[name=description-note-edit]').val();
        var notecategory = $('select[name=category-note-edit]').val();
        let notetagsinput = $('input[name=tags-note-edit]').val();
        let notetagsarray = notetagsinput.split(', ');
        notetagsarray = notetagsarray.map(tag => tag.trim()).filter(tag => tag.length > 0);
        let userId = getUserId();

        var data = {
            'title': notetitle,
            'description': notedescription,
            'status': "active",
            'category': notecategory,
            'tags': notetagsarray,
            'user_id': userId
        };

        $.ajax({
            url: '/notes/edit/' + noteId,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            dataType: 'json',
            success: function(response) {
                let messageMap = {
                    "successful": "Note has been added successfully",
                    "error": "You need to fill in all the necessary fields"
                };
                if (response.successful) {
                    $('.panel-editnote').hide();
                    $('.panel-mynotes').show();
                    load_active_notes();
                    console.log(response);
                } else {
                    $(".alert").hide();
                    $(".alert").html(messageMap[response.status])
                    $(".alert").show();
                    console.log(messageMap[response.status] || "Unknown Status");
                }
            },
            error: function(error) {
                console.error(error);
            }
        });
    });
}


export function get_last_note(userId) {
    get_username(userId, function(username) {
        $.ajax({
            url: '/notes/latest/' + userId,
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                var mainContainer = $('.panel-home');
                var welcomeMessage = `
                    <h3 id="welcome-message">Welcome back, ${username}</h3>
                    <p>Here you can capture and organize your thoughts and ideas, adding titles, descriptions, categories, tags, and more. Start your journey towards better note management today!</p>`;
                mainContainer.empty().append(welcomeMessage);

                if (response.error) {
                    console.error(response.error);
                } else {
                    console.log(response);
                    var latestNote = `
                        <div class="last-note">
                            <h5>Your Last Note is:</h5>
                            <div class="last-note-div">
                                <h6 class="last-note-title">${response.title}</h6>
                                <p>${response.description}</p>
                            </div>
                            <div class="last-note-info">
                                <p>Author: ${username}</p>
                                <p>Date: ${response.updated_at}</p>
                            </div>
                            <div class="last-notes-buttons">
                                <input type="hidden" value="${response.id}">
                                <button type="button" class="btn bi-pencil-square" id="edit-note"></button>
                                <button type="button" class="btn bi-archive-fill" id="unarchive-note"></button>
                                <button type="button" class="btn bi-trash-fill" id="delete-note"></button>
                            </div>
                        </div>`;
                    mainContainer.append(latestNote);
                }
            },
            error: function(error) {
                console.error("Error fetching the latest note:", error);
            }
        });
    });
}
