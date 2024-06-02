from flask import render_template, request, jsonify
from flask_app import app

from flask_app.Services.Database import session, Note, Category, User
from flask_bcrypt import Bcrypt
from datetime import datetime

bcrypt = Bcrypt(app)

# Route main to render index.html

@app.route("/")
def index():
    return render_template("index.html")

# Add_note, rem_note edit_notes for add, remove and edit notes

@app.route("/notes/add", methods=["POST"])
def add_note():
    data = request.get_json()
    required_fields = ['title', 'description', 'status', 'category', 'tags', 'user_id']
    
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        print(data)
        print(f"missing fields are {missing_fields}")
        return jsonify({"error": f"The fields {', '.join(missing_fields)} are required."}), 400
    
    new_note = Note(
        title=data['title'],
        description=data['description'],
        status=data['status'],
        tags=','.join(data['tags']),
        user_id=data['user_id']
    )

    session.add(new_note)
    session.flush()

    for category_name in data['category']:
        category = session.query(Category).filter_by(name=category_name).first()
        if not category:
            category = Category(name=category_name)
            session.add(category)
            session.flush()
        new_note.categories.append(category)

    session.commit()

    return jsonify({"successful" : "Note has been added successfully"}), 200

@app.route("/notes/remove/<int:id>", methods=["DELETE"])
def rem_note(id):
    data = request.get_json()
    note = session.query(Note).get(id)

    if note is None:
        return jsonify({"error": "Note not found"}), 404

    if data['user_id'] != note.user_id:
        return jsonify({"not_perm": "You have no permission to remove this note"}), 403

    session.delete(note)
    session.commit()

    return jsonify({"successful": "Note has been successfully removed from the system."}), 200



@app.route("/notes/edit/<int:id>", methods=["POST"])
def edit_note(id):
    data = request.get_json()
    note = session.query(Note).get(id)

    required_fields = ['title', 'description', 'tags', 'user_id']
    for field in required_fields:
        if not data.get(field):
            print(field)
            return jsonify({"error": f"The field {field} is required."}), 400

    if note is None:
        return jsonify({"error": "Note not found"}), 404

    if data['user_id'] != note.user_id:
        return jsonify({"error": "You have no permission to remove this note"}), 403

    fields_to_update = ['title', 'description', 'tags']
    update_fields = {field: data.get(field) for field in fields_to_update if data.get(field)}

    if 'tags' in update_fields:
        update_fields['tags'] = ', '.join(update_fields['tags'])

    if update_fields:
        session.query(Note).filter(Note.id == id).update(update_fields, synchronize_session=False)
        session.commit()

    return jsonify({"successful": "Note has been successfully updated! :D"}), 200


# Archive and Unarchive notes

@app.route("/notes/archive/<int:id>", methods=["POST"])
def archive_note(id):
    data = request.get_json()
    note = session.query(Note).get(id)
    note_status = note.status
    new_status = data.get('status')

    if note is None:
        return jsonify({"error": "Note not found"}), 404
    
    if data['user_id'] != note.user_id:
        return jsonify({"error": "You have no permission to remove this note"}), 403
    
    if note_status == "archived":
        return jsonify({"archived": "Note has already archived"}), 403
    
    if new_status:
        session.query(Note).filter(Note.id == id).update({Note.status: new_status},synchronize_session=False)
        session.commit()
    
    return jsonify({"successful": "Note status updated successfully"}, 200)

@app.route("/notes/unarchive/<int:id>", methods=["POST"])
def unarchive_note(id):
    data = request.get_json()
    note = session.query(Note).get(id)
    note_status = note.status
    new_status = data.get('status')

    if note is None:
        return jsonify({"error": "Note not found"}), 404
    
    if data['user_id'] != note.user_id:
        return jsonify({"error": "You have no permission to remove this note"}), 403
    
    if note_status == "active":
        return jsonify({"active": "Note has already active"}), 403
    
    if new_status:
        session.query(Note).filter(Note.id == id).update({Note.status: new_status},synchronize_session=False)
        session.commit()
    
    return jsonify({"successful": "Note status updated successfully"}, 200)

# Get All notes active and get all notes archived

@app.route("/note/<int:id>", methods=["GET"])
def get_note_by_id(id):
    note = session.query(Note).get(id)
    user_id = request.args.get('user_id')

    if user_id is None:
        return jsonify({"error": "User ID is required"}), 400


    if note:
        return jsonify({
            "id": note.id,
            "title": note.title,
            "description": note.description,
            "tags": note.tags.split(', '),
            "categories": [category.name for category in note.categories],
            "created_at": note.created_at.strftime("%d/%m/%Y"),
            "updated_at": note.updated_at.strftime("%d/%m/%Y") if note.updated_at else None
        }), 200
    else:
        return jsonify({"error": "Note not found"}), 404

@app.route("/user/<int:user_id>/active_notes", methods=["GET"])
def get_all_active_notes(user_id): 
    notes = session.query(Note).filter(Note.user_id == user_id, Note.status == "active").all()

    if not notes:
        return jsonify({"error": "Notes not found for this user"}), 404
    
    notes_list = [{"id": note.id, "title": note.title, "description": note.description, "status": note.status, "categories": [category.name for category in note.categories], "tags": note.tags, "updated_at" : note.updated_at.strftime("%d/%m/%y") if note.updated_at else note.created_at.strftime("%d/%m/%Y")} for note in notes]
    
    return jsonify(notes_list), 200

@app.route("/user/<int:user_id>/archived_notes", methods=["GET"])
def get_all_archived_notes(user_id): 
    notes = session.query(Note).filter(Note.user_id == user_id, Note.status == "archived").all()

    if not notes:
        return jsonify({"error": "No notes found for this user"}), 404
    
    notes_list = [{"id": note.id, "title": note.title, "description": note.description, "status": note.status, "categories": [category.name for category in note.categories], "tags": note.tags, "updated_at" : note.updated_at.strftime("%d/%m/%y"), "created_at": note.created_at.strftime("%d/%m/%Y")} for note in notes]
    
    return jsonify(notes_list), 200

@app.route("/notes/latest/<int:user_id>", methods=["GET"])
def get_latest_note(user_id):
    note = session.query(Note).filter(Note.user_id == user_id).order_by(Note.created_at.desc()).first()

    if note:
        return jsonify({
            "id": note.id,
            "title": note.title,
            "description": note.description,
            "tags": note.tags.split(', '),
            "categories": [category.name for category in note.categories],
            "created_at": note.created_at.strftime("%d/%m/%Y"),
            "updated_at": note.updated_at.strftime("%d/%m/%Y") if note.updated_at else None
        }), 200
    else:
        return jsonify({"error": "No notes found for this user"}), 404


# add and remove category from a note

@app.route("/notes/<int:id>/categories", methods=["POST"])
def add_category_to_note(id):
    data = request.get_json()
    note = session.query(Note).get(id)
    category = session.query(Category).get(data.get('category_id'))

    if note is None or category is None:
        return jsonify({"error": "Note or Category not found"}), 404

    if data['user_id'] != note.user_id:
        return jsonify({"error": "You have no permission to modify this note"}), 403

    note.categories.append(category)
    session.commit()

    return jsonify({"successful": "Category has been successfully added to the note."}), 200

@app.route("/notes/<int:id>/categories/<int:category_id>", methods=["POST"])
def remove_category_from_note(id, category_id):
    data = request.get_json()
    note = session.query(Note).get(id)
    category = session.query(Category).get(category_id)

    if note is None or category is None:
        return jsonify({"error": "Note or Category not found"}), 404

    if data['user_id'] != note.user_id:
        return jsonify({"error": "You have no permission to modify this note"}), 403

    note.categories.remove(category)
    session.commit()

    return jsonify({"successful": "Category has been successfully removed from the note."}), 200

@app.route("/notes/categories/<int:category_id>", methods=["GET"])
def get_notes_by_category(category_id):
    category = session.query(Category).get(category_id)

    if category is None:
        return jsonify({"error": "Category not found"}), 404

    notes = session.query(Note).filter(Note.categories.contains(category)).all()
    return jsonify([note.to_dict() for note in notes]), 200

