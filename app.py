from flask import Flask, render_template, request, jsonify, send_from_directory
from loader import CameraLoader
from detection import ProcessVideo
import os
app = Flask(__name__)

UPLOAD_FOLDER = "uploads" #store video files
os.makedirs(UPLOAD_FOLDER, exist_ok=True) #creates uploads folder if not exit
camera_loader = CameraLoader("datasets")
camera_objects = camera_loader.load()


@app.route("/")
def home():
    return render_template("index.html", cameras=camera_objects) #shows the main dashboard and camera data for the map

@app.route("/upload", methods=["POST"])
def upload():
    file = request.files["video"] # get the video file from the request
    filepath = os.path.join(UPLOAD_FOLDER, file.filename) #create path to save video
    file.save(filepath)
    processor = ProcessVideo(filepath)
    result = processor.video()
    # returns vehicle stats, graph data and processed video
    return jsonify({"vehicles": result["vehicle_count"], "vehicle_stats": result["vehicle_stats"], "graph_data": result["graph_data"], "co2": result["co2"], "video": "/static/processed.mp4"})

if __name__ == "__main__":
    app.run(debug=True)