from flask import request, jsonify
from flask_app import app

from flask_app.Services.Database import User, session
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt(app)

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    user = session.query(User).filter(User.username == data['username']).first()
    
    if user is None:
        return jsonify({"error": "User not found"}), 404
    
    if bcrypt.check_password_hash(user.password, data['password']):
        return jsonify({"successful": "Log in successful", "user_id": user.id}), 200
    
    else:
        return jsonify({"not_password": "Passwords doesn't match"}), 401
    
@app.route("/register", methods=['POST'])
def register():
    data = request.get_json()
    user = session.query(User).filter(User.username == data['username']).first()
    required_fields = ['username', 'password']

    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"The field {field} is required."}), 400

    if data['username'] == data['password']:
        return jsonify({"error": "The username and the password can't be the same"})
    
    if len(data['username']) < 4:
        return jsonify({"error": "The username needs to be more than 4 characters"})
    
    if len(data['password']) < 5:
        return jsonify({"error": "The password needs to be more than 5 characters"})

    if data['password'] != data['password2']:
        return jsonify({"error": "The passwords doesn't match."})
    
    if user:
        return jsonify({"error": "The username already exists in the system."}), 404
    
    
    pass_bcrypt = bcrypt.generate_password_hash(data['password'])

    new_user = User(
        username=data['username'],
        password=pass_bcrypt
    )

    session.add(new_user)
    session.commit()

    return jsonify({"successful": "The username has been successfully added."}), 200


@app.route("/api/get_user/<int:userid>", methods=['GET'])
def get_user(userid):
    user = session.query(User).filter_by(id=userid).first()
    if user is None:
        return jsonify({"error" : "Username not found"}), 404
    
    user_dict = {
        'id': user.id,
        'username': user.username
    }

    return jsonify(user_dict), 200