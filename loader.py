import os, json


class Camera:
    def __init__(self, name, latitude, longitude, video_url): # constructor
        self.name = name
        self.latitude = latitude
        self.longitude = longitude
        self.video_url = video_url

    def dict(self):   # object to dictionary
        return {
            "name": self.name,
            "lat": self.latitude,
            "lon": self.longitude,
            "stream_url": self.video_url
        }

class CameraLoader:
    def __init__(self, dataset_folder): # constructor
        self.dataset_folder = dataset_folder
    def load(self):
        cameras = []
        for file in os.listdir(self.dataset_folder):
            if not file.endswith(".json"):
                continue
            with open(os.path.join(self.dataset_folder, file)) as data:
                data = json.load(data)
            for item in data.get("data", []):
                camera_data = item.get("cctv", {})
                if self.live(camera_data):
                    camera = self.create(camera_data)
                    if camera:
                        cameras.append(camera.dict())
        return cameras

    def live(self, camera_data):
        if camera_data.get("inService") != "true":
            return False
        image_data = camera_data.get("imageData", {})
        if not image_data.get("streamingVideoURL"):
            return False
        return True

    def create(self, camera_data):
        location = camera_data.get("location", {})
        image_data = camera_data.get("imageData", {})
        latitude = location.get("latitude")
        longitude = location.get("longitude")
        if not latitude or not longitude:
            return None
        return Camera(location.get("locationName", "Unknown camera"), float(latitude), float(longitude), image_data.get("streamingVideoURL"))

