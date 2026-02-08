import cv2
import pytesseract
from deepface import DeepFace
import numpy as np
import os
import re

# ==========================================
# CONFIGURATION
# ==========================================
# Update this path to point to your Tesseract executable
# Common paths:
# Windows: r'C:\Program Files\Tesseract-OCR\tesseract.exe'
# Linux: '/usr/bin/tesseract'
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

class IDVerifier:
    def __init__(self, model_name="ArcFace", detector_backend="opencv", output_threshold=0.68):
        """
        Initialize the ID Verifier with DeepFace.
        :param model_name: ArcFace, VGG-Face, etc.
        :param detector_backend: opencv, retinaface, mtcnn, ssd, dlib, mediapipe
        :param output_threshold: Confidence threshold for verification.
        """
        self.model_name = model_name
        self.detector_backend = detector_backend
        self.output_threshold = output_threshold

    def _load_image(self, image_path):
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")
        return cv2.imread(image_path)

    def extract_text(self, image):
        """
        Extracts text from the ID card image using Tesseract OCR.
        Applies preprocessing to improve accuracy.
        Gracefully returns empty string if Tesseract is not installed/found.
        """
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Denoising
            gray = cv2.fastNlMeansDenoising(gray)
            
            # Thresholding to get black text on white background (or vice versa)
            # Otsu's thresholding
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Extract text
            custom_config = r'--oem 3 --psm 6' # PSM 6: Assume a single uniform block of text.
            text = pytesseract.image_to_string(binary, config=custom_config)
            
            return text.strip()
        except pytesseract.TesseractNotFoundError:
            print("\n[WARNING] Tesseract OCR not found. Text extraction skipped.")
            print("To enable OCR, install Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki")
            return ""
        except Exception as e:
            print(f"\n[WARNING] OCR Error: {e}")
            return ""

    def detect_face(self, image_path, image_type="ID Card"):
        """
        Detects if a face exists in the image using DeepFace.
        Returns True/False and coordinates if possible.
        """
        try:
            # We use extract_faces to see if a face is detectable
            face_objs = DeepFace.extract_faces(
                img_path=image_path, 
                detector_backend=self.detector_backend,
                enforce_detection=False
            )
            # Filter out low confidence if needed, but extract_faces usually returns valid ones
            if len(face_objs) > 0:
                return face_objs[0]['facial_area'] # {'x':, 'y':, 'w':, 'h':}
            return None
        except:
            return None

    def validate_id_details(self, text):
        """
        Checks if extracted text contains expected ID keywords.
        """
        if not text:
             return {
                "valid_structure": False,
                "found_keywords": [],
                "cleaned_text": ""
            }

        keywords = ['Name', 'DOB', 'Date of Birth', 'No', 'ID', 'REPUBLIC', 'GOVERNMENT']
        found_keywords = [word for word in keywords if word.lower() in text.lower()]
        
        # Mask hypothetical ID numbers (e.g., regex for typical formats)
        masked_text = re.sub(r'\d{8,}', '********', text)
        
        return {
            "valid_structure": len(found_keywords) > 0,
            "found_keywords": found_keywords,
            "cleaned_text": masked_text
        }

    def verify_user(self, id_card_path, selfie_path):
        print(f"--- Starting Verification ---")
        print(f"ID Card: {id_card_path}")
        print(f"Selfie: {selfie_path}")

        # 1. Load Images for OCR (OpenCV)
        try:
            id_img = self._load_image(id_card_path)
            # selfie_img = self._load_image(selfie_path) # Not strictly needed for OCR, but good to check existence
        except Exception as e:
            return {"verified": False, "error": str(e)}

        # 2. Extract Text from ID
        print("Extracting text from ID...")
        raw_text = self.extract_text(id_img)
        text_analysis = self.validate_id_details(raw_text)
        print(f"Text Analysis: {text_analysis['found_keywords']}")

        # 3. Detect Faces & Verify (DeepFace)
        print("Verifying faces with DeepFace...")
        try:
            result = DeepFace.verify(
                img1_path=id_card_path,
                img2_path=selfie_path,
                model_name=self.model_name,
                detector_backend=self.detector_backend,
                distance_metric="cosine",
                enforce_detection=False # Pass gracefully if no face found, handle in result
            )
        except Exception as e:
            return {
                "verified": False, 
                "result_status": "ERROR", 
                "reason": f"DeepFace Error: {str(e)}", 
                "details": text_analysis
            }

        # 4. Process Result
        is_verified = result['verified']
        distance = result['distance']
        threshold = result['threshold']
        
        # Convert distance to similarity score (approximate)
        # Cosine distance: 0 (same in same dir) to 2 (opposite). Usually < 0.4 is match.
        # DeepFace thresholds vary by model. For ArcFace, it's around 0.68.
        # Let's map 0..threshold to 100..50% and threshold..1 to 50..0% roughly
        
        if distance <= threshold:
            similarity = 100 - (distance / threshold) * 50 # Simply scaling 0-thresh to 100-50
        else:
            similarity = 50 - ((distance - threshold) / (1 - threshold)) * 50
            if similarity < 0: similarity = 0
            
        verification_result = "VERIFIED" if is_verified else "NOT VERIFIED"

        result_packet = {
            "verified": is_verified,
            "result_status": verification_result,
            "face_similarity_score": round(similarity, 2),
            "face_distance": round(distance, 4),
            "threshold_used": threshold,
            "model_used": self.model_name,
            "ocr_text_found": bool(raw_text),
            "ocr_keywords": text_analysis['found_keywords'],
            "masked_text_sample": text_analysis['cleaned_text'][:100] + "..." if text_analysis['cleaned_text'] else ""
        }
        
        return result_packet

# ==========================================
# EXECUTION
# ==========================================
if __name__ == "__main__":
    verifier = IDVerifier()
    
    # User provided files
    id_card = "Untitled design.jpg"
    selfie = "WIN_20260208_01_22_40_Pro.jpg"
    
    if os.path.exists(id_card) and os.path.exists(selfie):
        result = verifier.verify_user(id_card, selfie)
        
        print("\n=== FINAL VERIFICATION RESULT ===")
        print(f"Status: {result['result_status']}")
        print(f"Blue Tick Granted: {result['verified']}")
        print(f"Similarity Score: {result['face_similarity_score']}%")
        print(f"Message: {result.get('reason', 'Verification processed successfully')}")
        print("=================================")
    else:
        print("\n[!] Please make sure the following files exist:")
        print(f"    - {id_card}")
        print(f"    - {selfie}")
