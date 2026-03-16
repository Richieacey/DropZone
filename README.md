# 📁 DropZone

DropZone is a sleek, modern, and lightweight local file-sharing application. Built with a beautiful **Glassmorphic UI**, it allows you to quickly share files across your local network between your PC and mobile devices with zero configuration.

![DropZone Amber Theme](https://img.shields.io/badge/Theme-Amber%20Orange-orange)
![Python 3.12](https://img.shields.io/badge/Python-3.12-blue)
![React](https://img.shields.io/badge/React-18-cyan)

## ✨ Features

- **💎 Stunning Glassmorphic UI**: A premium dark-mode interface with vibrant amber gradients and smooth micro-animations.
- **🚀 Multi-File Support**: Drag and drop multiple files at once or use the batch upload selector.
- **📱 Instant Mobile Connection**: Connect your phone instantly by scanning a dynamically generated QR code that resolves your local IP address.
- **📦 Standalone Executable**: No Python installation required on the target machine. Just run the `dropzone.exe`.
- **🔍 Smart File Icons**: Context-aware icons for images, videos, audio, archives, and code files.
- **⚡ Real-time Feedback**: Interactive upload progress bars and refreshable file lists.

## 🛠️ Tech Stack

### Backend
- **Python / Flask**: Efficient lightweight server.
- **Flask-CORS**: Cross-origin resource sharing for seamless frontend integration.
- **Werkzeug**: Robust file handling and security utilities.
- **PyInstaller**: For bundling the entire app into a single `.exe`.

### Frontend
- **React**: Component-based reactive interface.
- **Vite**: Ultra-fast build tool and development server.
- **Lucide-React**: High-quality, consistent iconography.
- **QRCode.React**: Dynamic QR code generation for network bridging.
- **Axios**: Promised-based HTTP client for API interactions.

## 🚀 Getting Started

### Using the Executable (Recommended)
1. Download the `dropzone.exe`.
2. Double-click to run.
3. Open your browser to `http://localhost:5555` or scan the QR code in the header with your phone.

### Development Setup
If you want to modify the source code:

**1. Clone the repository**
```bash
git clone https://github.com/Richieacey/DropZone.git
cd DropZone
```

**2. Setup Backend**
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install flask flask-cors werkzeug
```

**3. Setup Frontend**
```bash
cd frontend
npm install
npm run dev
```

**4. Build the Project**
To create your own standalone executable:
```bash
# In the frontend directory
npm run build

# In the root directory
pyinstaller --noconfirm --onefile --noconsole --add-data "dist;dist" --hidden-import flask --hidden-import flask_cors --hidden-import werkzeug --hidden-import waitress --icon dropzone.ico dropzone.py
```

## 📂 Project Structure
```text
DropZone/
├── dropzone.py         # Main Flask Backend
├── my_files/           # Your uploaded files (created at runtime)
├── dist/               # Built React frontend assets
├── frontend/           # React Source Code
│   ├── src/
│   │   ├── App.jsx     # Main Application Logic
│   │   └── index.css   # Glassmorphic Styling
│   └── vite.config.js
└── dropzone.exe        # Final Standalone Binary
```

---
Developed with ❤️ by Richieacey
