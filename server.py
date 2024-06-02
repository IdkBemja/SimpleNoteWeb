from flask_app import app

from flask_app.Controllers import notes_controller, users_controller
from flask_app.Services import Database

if __name__ == "__main__":
    app.run(debug=True)