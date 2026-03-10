# runtime_template/backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import importlib
import pkgutil
from pathlib import Path
import sys

app = FastAPI(title="Generated App API")

# ═══════════════════════════════════════════════════════════
# CORS - Allow frontend to connect
# ═══════════════════════════════════════════════════════════
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════
# AUTO-DISCOVER AND REGISTER ALL ROUTERS
# ═══════════════════════════════════════════════════════════
def register_routers():
    """
    Automatically discovers and registers all routers in api/ folder
    This ensures ZERO manual registration - no 404s!
    """
    try:
        # Get the api package path
        api_package = "api"
        
        # Import the api package to make it discoverable
        api_module = importlib.import_module(api_package)
        api_path = Path(api_module.__file__).parent
        
        print("\n" + "="*60)
        print("🔍 AUTO-DISCOVERING API ROUTERS")
        print("="*60)
        
        # Iterate through all modules in api/
        for module_info in pkgutil.iter_modules([str(api_path)]):
            module_name = module_info.name
            
            # Skip __init__ and health (health is registered separately)
            if module_name in ["__init__", "health"]:
                continue
            
            try:
                # Import the module
                full_module_name = f"{api_package}.{module_name}"
                module = importlib.import_module(full_module_name)
                
                # Check if module has a 'router' attribute
                if hasattr(module, "router"):
                    app.include_router(module.router)
                    print(f"✅ Registered: {module_name}.py")
                else:
                    print(f"⚠️  Skipped {module_name}.py (no router found)")
                    
            except Exception as e:
                print(f"❌ Failed to load {module_name}: {e}")
        
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"❌ Router discovery failed: {e}")

# Register all routers on startup
register_routers()

# ═══════════════════════════════════════════════════════════
# HEALTH CHECK (Always present)
# ═══════════════════════════════════════════════════════════
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": "generated-api",
        "version": "1.0.0"
    }

@app.get("/")
def root():
    return {
        "message": "Generated API is running",
        "docs": "/docs",
        "health": "/health"
    }

# ═══════════════════════════════════════════════════════════
# STARTUP EVENT - Initialize Database
# ═══════════════════════════════════════════════════════════
@app.on_event("startup")
def startup_event():
    """
    Template-level startup:
    - Create tables
    - Seed default rows for ALL entities
    """

    try:
        from db.base import engine, Base, SessionLocal
        from db import models

        # 1️⃣ Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created")

        # 2️⃣ Seed every entity automatically
        db = SessionLocal()

        for model_name in dir(models):

            model = getattr(models, model_name)

            # Only real SQLAlchemy models have __tablename__
            if hasattr(model, "__tablename__"):

                # If table is empty → seed 1 row
                if db.query(model).count() == 0:

                    # Build dummy fields
                    sample_data = {}

                    for column in model.__table__.columns:
                        if column.name == "id":
                            continue

                        # Default values by type
                        if "String" in str(column.type):
                            sample_data[column.name] = f"Sample {model_name}"
                        elif "Integer" in str(column.type):
                            sample_data[column.name] = 1
                        elif "Float" in str(column.type):
                            sample_data[column.name] = 0.0
                        elif "Boolean" in str(column.type):
                            sample_data[column.name] = True

                    # Insert dummy row
                    try:
                        db.add(model(**sample_data))
                        db.commit()
                        print(f"✅ Seeded {model_name}")

                    except Exception:
                        db.rollback()
                        print(f"⚠️ Could not seed {model_name}")

        db.close()

    except Exception as e:
        print(f"❌ Startup failed: {e}")
