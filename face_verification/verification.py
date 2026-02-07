from deepface import DeepFace
import os
import cv2
import numpy as np

class FaceVerifier:
    def __init__(self, model_name="ArcFace", detector_backend="opencv", distance_metric="cosine"):
        self.model_name = model_name
        self.detector_backend = detector_backend
        self.distance_metric = distance_metric
        self.threshold = 0.68 

    def verify(self, img1_path, img2_path):
        """
        Verifies if two images belong to the same person.
        """
        try:
            result = DeepFace.verify(
                img1_path=img1_path,
                img2_path=img2_path,
                model_name=self.model_name,
                detector_backend=self.detector_backend,
                distance_metric=self.distance_metric,
                enforce_detection=True,
                align=True
            )
            
            return {
                "verified": result['verified'],
                "distance": result['distance'],
                "threshold": result['threshold'],
                "model": self.model_name,
                "similarity_metric": self.distance_metric,
                "facial_areas": result.get('facial_areas', {})
            }

        except ValueError as e:
            return {
                "verified": False,
                "error": str(e),
                "message": "Face could not be detected in one or both images."
            }
        except Exception as e:
             return {
                "verified": False,
                "error": str(e),
                "message": "An error occurred during verification."
            }
