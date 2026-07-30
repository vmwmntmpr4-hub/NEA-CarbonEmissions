import cv2
from ultralytics import YOLO


class ProcessVideo:

    """ Process the uploaded video and uses the yoloV8 model to do object recognition """
    def __init__(self, video_path):
        self.model = YOLO("yolov8n.pt") # model that categorises and object recognition
        self.model.to("mps")
        self.vs = cv2.VideoCapture(video_path) # video upload
        self.colors = {
            1: (255, 0, 255),  # motorcycle = magenta
            2: (0, 255, 0),  # car and van = green
            5: (0, 255, 255),  # bus = yellow
            7: (0, 0, 255)  # lorry / truck = red
        }

    """ draws bounding box around the detected objects """
    def draw_detection(self, frame, box):
        category = int(box.cls)
        if box.id is not None:
            track_id = int(box.id.item())
        else:
            track_id = 0
        prob = float(box.conf)
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        color = self.colors.get(category, (255, 255, 255))
        name = self.model.names[category]
        label = f"{name} {track_id} ({prob:.2f})" # makes a string for text above the box - Name of vehicle / ID / confidence rounded to 2 significant figures ready to be put on the box
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 4) # draws the rectangular box around the vehicle ############# make this look more appealing later ##################
        cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2) # puts the text above the box

    """ processes every frame of uploaded video and then sends data to dashboard to display """

    def video(self):
        vehicle_count = 0
        vehicle_stats = {"car": 0, "motorcycle": 0, "bus": 0, "truck": 0}
        seen_ids = set() # prevent same vehicle being detected
        width = int(self.vs.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(self.vs.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = self.vs.get(cv2.CAP_PROP_FPS)
        output_path = "static/processed.mp4"
        writer = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, (width, height))
        frame_number = 0
        graph_data = [] # stores data points for the graph
        track_age = {} # track how long vehicle is visible to stop random blobs
        vehicle_classes = {}
        while True:
            grabbed, frame = self.vs.read()
            if not grabbed: # ends when no frames left
                break
            frame_number += 1
            if frame_number % 1 != 0:
                writer.write(frame)
                continue
            results = self.model.track(frame, persist=True, tracker="bytetrack.yaml", verbose=False, conf=0.5, classes=[2, 3, 5, 7]) # detect and track the vehicles
            for result in results:
                for box in result.boxes:
                    self.draw_detection(frame, box)
                    if box.id is None:
                        continue
                    track_id = int(box.id.item())
                    # record how many frames vehicle has been tracked
                    if track_id not in track_age:
                        track_age[track_id] = 1
                    else:
                        track_age[track_id] += 1
                    category = int(box.cls)
                    # stops vehicles changing class
                    if track_id not in vehicle_classes:
                        vehicle_classes[track_id] = category
                    category = vehicle_classes[track_id]
                    print(f"ID={track_id} Class={category}")
                    if category not in [2, 3, 5, 7]:
                        continue
                    track_id = int(box.id.item())
                    # must be 15 frames before counting
                    if track_age[track_id] >= 15 and track_id not in seen_ids:
                        seen_ids.add(track_id)
                        vehicle_count += 1
                        if category == 2:
                            vehicle_stats["car"] += 1
                        elif category == 3:
                            vehicle_stats["motorcycle"] += 1
                        elif category == 5:
                            vehicle_stats["bus"] += 1
                        elif category == 7:
                            vehicle_stats["truck"] += 1
                    # stores graph data at a rate of 5 frames
            if frame_number % 5 == 0:
                graph_data.append({
                    "time": frame_number / fps,
                    "cars": vehicle_stats["car"],
                    "motorcycles": vehicle_stats["motorcycle"],
                    "buses": vehicle_stats["bus"],
                    "trucks": vehicle_stats["truck"]
                })
            writer.write(frame)
        self.vs.release()
        writer.release()
        # estimates using constants
        co2_cars = vehicle_stats["car"] * 0.12
        co2_motorcycles = vehicle_stats["motorcycle"] * 0.08
        co2_buses = vehicle_stats["bus"] * 0.90
        co2_trucks = vehicle_stats["truck"] * 1.20
        total_co2 = (co2_cars + co2_motorcycles + co2_buses + co2_trucks)
        # return all the data back to flask backend
        return {
            "vehicle_count": vehicle_count,
            "vehicle_stats": vehicle_stats,
            "graph_data": graph_data,

            "co2": {
                "total": round(total_co2, 2),
                "cars": round(co2_cars, 2),
                "motorcycles": round(co2_motorcycles, 2),
                "buses": round(co2_buses, 2),
                "trucks": round(co2_trucks, 2)
            }
        }



