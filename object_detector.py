
import numpy as np
import os
import six.moves.urllib as urllib
import sys
import tarfile
import tensorflow as tf
import zipfile
import json
import scipy.misc

from collections import defaultdict
from io import StringIO
from matplotlib import pyplot as plt
import matplotlib.patches as patches
from PIL import Image

from watson_developer_cloud import VisualRecognitionV3

if tf.__version__ != '1.4.0':
  raise ImportError('Please upgrade your tensorflow installation to v1.4.0!')

class ObjectDetector():
    def __init__(self):
        # self.model_name = 'faster_rcnn_resnet101_coco_2017_11_08'
        self.model_name = 'ssd_mobilenet_v1_coco_2017_11_17'
        self.download_base = 'http://download.tensorflow.org/models/object_detection/'

        print ("Setting up object detector.")
        print ("+ Downloads model...")
        self.download_model()
        print ("+ Loads model...")
        self.load_model()
        print ("+ Initializes Watson Visual Recognition...")
        self.setup_watson()
        print ("Done.")


    def download_model(self):
        if not os.path.exists('pretrained_model'):
            os.mkdir('pretrained_model')

        if not os.path.exists('pretrained_model/%s' % self.model_name):
            opener = urllib.request.URLopener()
            opener.retrieve(self.download_base + '/%s.tar.gz' % self.model_name, 'pretrained_model/%s.tar.gz' % self.model_name)
            tar_file = tarfile.open('pretrained_model/%s.tar.gz' % self.model_name)
            for file in tar_file.getmembers():
                file_name = os.path.basename(file.name)
                if 'frozen_inference_graph.pb' in file_name:
                    tar_file.extract(file, 'pretrained_model')

    def load_model(self):
        path_to_frozen = 'pretrained_model/%s/frozen_inference_graph.pb' % self.model_name
        self.detection_graph = tf.Graph()
        with self.detection_graph.as_default():
            od_graph_def = tf.GraphDef()
            with tf.gfile.GFile(path_to_frozen, 'rb') as fid:
                serialized_graph = fid.read()
                od_graph_def.ParseFromString(serialized_graph)
                tf.import_graph_def(od_graph_def, name='')

    def setup_watson(self):
        # Replace with your api key
        WATSON_API_KEY = '05572b8833ce3e4086391ffa8c55b50381ec6d15'
        self.visual_recognition = VisualRecognitionV3('2017-11-30', api_key=WATSON_API_KEY)

    def load_image_into_numpy_array(self, img):
        """Helper function which transforms the PIL Image into a numpy array"""
        im_width, im_height = img.size
        img_data = img.getdata()
        return np.array(img.getdata())[:, :3].reshape(
            (im_height, im_width, 3)).astype(np.uint8)

    def detect_objects(self, image, label):
        img_height, img_width = None, None
        print ("Object detection.")
        with self.detection_graph.as_default():
            with tf.Session(graph=self.detection_graph) as sess:

                # Placeholder variables
                image_tensor = self.detection_graph.get_tensor_by_name('image_tensor:0')
                detection_boxes = self.detection_graph.get_tensor_by_name('detection_boxes:0')
                detection_scores = self.detection_graph.get_tensor_by_name('detection_scores:0')
                detection_classes = self.detection_graph.get_tensor_by_name('detection_classes:0')
                num_detections = self.detection_graph.get_tensor_by_name('num_detections:0')
           
                print ("OBJECT DETECTION")
                # Numpy representation of image
                image_np = self.load_image_into_numpy_array(image)
                img_height, img_width, _ = image_np.shape
                
                # Create figure and axes and display the image
                fig = plt.figure(figsize=(24, 16), frameon=False)
                fig = plt.imshow(image_np)
                
                # Expand dimensions since the model expects images to have shape: [1, None, None, 3]
                image_np_expanded = np.expand_dims(image_np, axis=0)
                
                # Do object detection.
                print ("+ Detecting objects")
                (boxes, scores, classes, num) = sess.run(
                    [detection_boxes, detection_scores, detection_classes, num_detections],
                    feed_dict={image_tensor: image_np_expanded})
                
                boxes = np.squeeze(boxes)
                classes = np.squeeze(classes).astype(np.int32)
                scores = np.squeeze(scores)

                # From normalized coordinates to pixel coordinates
                boxes[:, [0, 2]] *= img_height
                boxes[:, [1, 3]] *= img_width

                # Sort by score in descending order
                # idx = np.argsort(scores)[::-1]
                # boxes = boxes[idx]
                # classes = classes[idx]
                # scores = scores[idx]
                
                print ("+ Classifying objects")
                objects = []

                # Draw box with highest score
                highest = {'score': 0, 'coordinates': []}

                for box, score, _ in zip(boxes, scores, classes):
                    
                    # Get box coordinates (of upper left and lower right corners)
                    by1, bx1, by2, bx2 = box.astype(int)

                    # Filters out some boxes
                    if score < 0.3:
                        continue
                    
                    # Save cropped image as temporary file
                    obj = image.crop((bx1, by1, bx2, by2))
                    obj.save('tmp.png')
                    
                    contains_label = False
                    # Open cropped image and classify using Watson
                    with open('tmp.png', 'rb') as image_file:
                        watson_params = json.dumps({'threshold': 0.5, 'classifier_ids': ['default']})
                        results = self.visual_recognition.classify(images_file=image_file, parameters=watson_params)

                        object_suggestions = sorted(results['images'][0]['classifiers'][0]['classes'], reverse=True, key=lambda x: x['score'])
                        
                        print ("Object suggestions")
                        for o in object_suggestions:
                            print ("   %s: %s" % (o['class'], o['score']))
                            if o['class'] == label:
                                if o['score'] > highest['score']:
                                    highest = {'score': o['score'], 'coordinates': [by1, bx1, by2, bx2]}
                                break

                        # All objects returned as suggestions for object by Watson Visual Recognition
                        objects.extend([o['class'] for o in object_suggestions])

                # If the label we're looking for is in one of the suggested labels by the 
                # Watson Visual Recognition service then we draw the label and bounding box
                if label in objects:
                    by1, bx1, by2, bx2 = highest['coordinates']

                    print (highest['coordinates'])
                    box_height, box_width = (by2-by1), (bx2-bx1)
                    ax = plt.gca()
                    ax.text(bx1 + 5, 
                            by2 - 6, 
                            label, 
                            fontsize=12, 
                            color='black', 
                            bbox={'facecolor': 'w', 'edgecolor':'none'})

                    # Create a Rectangle patch
                    rect = patches.Rectangle((bx1, by1), 
                                             box_width, 
                                             box_height, 
                                             linewidth=3, 
                                             edgecolor='w', 
                                             facecolor='none')
                    ax = plt.gca()
                    ax.add_patch(rect)

                fig.axes.get_xaxis().set_visible(False)
                fig.axes.get_yaxis().set_visible(False)
                print ("Writing image to 'static/images/output.png'")
                plt.savefig('static/images/output.png', bbox_inches='tight', pad_inches=0.0)
                # plt.show()
                plt.close()
                print ()

                return objects

