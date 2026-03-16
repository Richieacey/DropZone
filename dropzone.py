from flask import Flask, send_from_directory, jsonify, request, abort
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import sys
import socket
# Forces pyinstaller to pick up these modules
import flask
import flask_cors
import werkzeug
import waitress

def get_resource_path(relative_path):
    """Get the absolute path to a resource, works for dev and for PyInstaller."""
    base_path = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_path, relative_path)

app = Flask(__name__, static_folder=get_resource_path('dist'), static_url_path='/')
CORS(app) # Enable CORS for frontend development

# Define the absolute path to your files folder
FILE_DIRECTORY = os.path.join(os.getcwd(), "my_files")
CLIPBOARD_FILE = os.path.join(FILE_DIRECTORY, "clipboard.txt")

@app.route('/')
def serve_frontend():
    if os.path.exists(os.path.join(app.static_folder, 'index.html')):
        return send_from_directory(app.static_folder, 'index.html')
    return "Frontend not built yet. Run 'npm run build' in the frontend directory.", 404

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(0)
    try:
        # doesn't even have to be reachable
        s.connect(('10.254.254.254', 1))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

@app.route('/api/network-info', methods=['GET'])
def network_info():
    ip = get_local_ip()
    port = 5555  # Assuming default port
    url = f"http://{ip}:{port}"
    return jsonify({'ip': ip, 'url': url})

@app.route('/api/files', methods=['GET'])
def list_files():
    try:
        files = []
        if os.path.exists(FILE_DIRECTORY):
            for filename in os.listdir(FILE_DIRECTORY):
                filepath = os.path.join(FILE_DIRECTORY, filename)
                if os.path.isfile(filepath):
                    stat = os.stat(filepath)
                    files.append({
                        'name': filename,
                        'size': stat.st_size,
                        'modified': stat.st_mtime
                    })
        return jsonify({'files': files})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    files = request.files.getlist('file')
    if not files or all(f.filename == '' for f in files):
        return jsonify({'error': 'No selected files'}), 400

    uploaded_files = []
    if not os.path.exists(FILE_DIRECTORY):
        os.makedirs(FILE_DIRECTORY)

    for file in files:
        if file.filename == '':
            continue
            
        filename = secure_filename(file.filename)
        filepath = os.path.join(FILE_DIRECTORY, filename)
        
        # Handle duplicate filenames
        base, ext = os.path.splitext(filename)
        counter = 1
        while os.path.exists(filepath):
            filename = f"{base}_{counter}{ext}"
            filepath = os.path.join(FILE_DIRECTORY, filename)
            counter += 1
            
        file.save(filepath)
        uploaded_files.append(filename)
        
    return jsonify({
        'message': f'{len(uploaded_files)} files uploaded successfully', 
        'filenames': uploaded_files
    }), 201

@app.route('/api/delete/<path:filename>', methods=['DELETE'])
def delete_file(filename):
    try:
        filename = secure_filename(filename)
        filepath = os.path.join(FILE_DIRECTORY, filename)
        if os.path.exists(filepath):
            os.remove(filepath)
            return jsonify({'message': 'File deleted successfully'}), 200
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clipboard', methods=['GET', 'POST'])
def manage_clipboard():
    try:
        if request.method == 'GET':
            content = ""
            if os.path.exists(CLIPBOARD_FILE):
                with open(CLIPBOARD_FILE, 'r', encoding='utf-8') as f:
                    content = f.read()
            return jsonify({'content': content})
            
        elif request.method == 'POST':
            data = request.json
            if not data or 'content' not in data:
                return jsonify({'error': 'No content provided'}), 400
            
            if not os.path.exists(FILE_DIRECTORY):
                os.makedirs(FILE_DIRECTORY)
                
            with open(CLIPBOARD_FILE, 'w', encoding='utf-8') as f:
                f.write(data['content'])
                
            return jsonify({'message': 'Clipboard updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/shutdown', methods=['POST'])
def shutdown():
    print("Shutdown request received. Terminating...")
    # Waitress doesn't have a clean programmatic shutdown in this thread context,
    # but we can forcefully exit the process since it's a standalone app.
    os._exit(0)
    return jsonify({'message': 'Server shutting down...'}), 200


@app.route('/file/<path:filename>', methods=['GET'])
def download_file(filename):
    # send_from_directory validates that 'filename' is within 'FILE_DIRECTORY'
    return send_from_directory(FILE_DIRECTORY, filename, as_attachment=True)

if __name__ == '__main__':
    # Ensure the directory exists before starting the server
    if not os.path.exists(FILE_DIRECTORY):
        os.makedirs(FILE_DIRECTORY)
        
    import threading
    import webbrowser
    import time

    def open_browser():
        time.sleep(1.5) # Give the server a moment to spin up
        target_url = "http://127.0.0.1:5555"
        print(f"Opening browser to {target_url}...")
        webbrowser.open(target_url)
        
    threading.Thread(target=open_browser, daemon=True).start()

    from waitress import serve
    print("Starting DropZone with Waitress WSGI server on port 5555...")
    serve(app, host='0.0.0.0', port=5555)