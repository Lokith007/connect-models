from deepface import DeepFace
import os
import cv2
import numpy as np

class FaceVerifier:
    def __init__(self, model_name="ArcFace", detector_backend="opencv", distance_metric="cosine"):
        self.model_name = model_name
        self.detector_backend = detector_backend
        self.distance_metric = distance_metric
        # Thresholds for ArcFace with Cosine Similarity
        # DeepFace default is usually good, but we can enforce strictness
        self.threshold = 0.68 # Slightly stricter than default for security

    def verify(self, img1_path, img2_path):
        """
        Verifies if two images belong to the same person.
        """
        try:
            # 1. Verify existence of faces first (DeepFace does this internally but we want control)
            # basic check to see if faces are detectable
            result = DeepFace.verify(
                img1_path=img1_path,
                img2_path=img2_path,
                model_name=self.model_name,
                detector_backend=self.detector_backend,
                distance_metric=self.distance_metric,
                enforce_detection=True, # STRICT: Fail if face not found
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
            # This usually happens if face is not detected
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
