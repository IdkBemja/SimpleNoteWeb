from flask import Flask
import os
from flask_app.Services.Database import init_db


clave_aleatoria = os.urandom(24)

app = Flask(__name__)

session = init_db()

app.secret_key = clave_aleatoria