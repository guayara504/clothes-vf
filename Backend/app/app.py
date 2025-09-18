from flask import Flask
import awsgi

app = Flask(__name__)

@app.route('/')
def index():
    return {"message": "¡Hola, mundo! La infraestructura de Clothes VF está desplegada."}

def main_handler(event, context):
    return awsgi.response(app, event, context)