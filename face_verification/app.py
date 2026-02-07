from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import shutil
import os
import uuid
from verification import FaceVerifier

app = FastAPI(title="Face Verification API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


verifier = FaceVerifier(model_name="ArcFace", detector_backend="opencv")

TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.post("/verify")
async def verify_identity(
    profile_image: UploadFile = File(...),
    live_image: UploadFile = File(...)
):
    
    request_id = str(uuid.uuid4())
    profile_path = os.path.join(TEMP_DIR, f"{request_id}_profile.jpg")
    live_path = os.path.join(TEMP_DIR, f"{request_id}_live.jpg")

    try:
       
        with open(profile_path, "wb") as buffer:
            shutil.copyfileobj(profile_image.file, buffer)
        with open(live_path, "wb") as buffer:
            shutil.copyfileobj(live_image.file, buffer)

      
        if os.path.getsize(live_path) < 1024 * 5: 
             return JSONResponse(status_code=400, content={"verified": False, "message": "Image too small or low quality."})


        result = verifier.verify(profile_path, live_path)
        
        os.remove(profile_path)
        os.remove(live_path)

        if "error" in result:
             return JSONResponse(status_code=400, content=result)

        return result

    except Exception as e:
        if os.path.exists(profile_path):
            os.remove(profile_path)
        if os.path.exists(live_path):
            os.remove(live_path)
            
        return JSONResponse(status_code=500, content={"verified": False, "error": str(e)})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
