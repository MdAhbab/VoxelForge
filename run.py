import os
import subprocess
import sys
import time

def run_command(command, cwd=None, shell=True):
    print(f"Running: {command} in {cwd or os.getcwd()}")
    process = subprocess.Popen(command, cwd=cwd, shell=shell)
    return process

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")
    
    # 1. Setup backend
    venv_dir = os.path.join(backend_dir, "venv")
    if not os.path.exists(venv_dir):
        print("Creating virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", "venv"], cwd=backend_dir, check=True)
    
    python_exe = os.path.join(venv_dir, "Scripts", "python.exe") if os.name == 'nt' else os.path.join(venv_dir, "bin", "python")
    
    print("Installing backend dependencies...")
    subprocess.run([python_exe, "-m", "pip", "install", "fastapi", "uvicorn", "sqlalchemy", "pydantic"], cwd=backend_dir, check=True)
    
    # 2. Setup frontend
    node_modules_dir = os.path.join(frontend_dir, "node_modules")
    if not os.path.exists(node_modules_dir):
        print("Installing frontend dependencies...")
        subprocess.run(["npm", "install"], cwd=frontend_dir, shell=True, check=True)
    
    print("Starting backend server...")
    # Using python -m uvicorn instead of uvicorn directly to ensure it uses the venv
    backend_process = run_command(f'"{python_exe}" -m uvicorn app.main:app --reload --port 8000', cwd=backend_dir)
    
    time.sleep(2) # Give backend a moment to start
    
    print("Starting frontend server...")
    frontend_process = run_command("npm run dev", cwd=frontend_dir)
    
    try:
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        backend_process.terminate()
        frontend_process.terminate()
        backend_process.wait()
        frontend_process.wait()
        print("Servers stopped.")

if __name__ == "__main__":
    main()
