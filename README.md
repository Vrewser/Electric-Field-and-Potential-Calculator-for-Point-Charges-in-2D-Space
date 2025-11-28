# Electric Field & Potential Calculator - Web UI

Interactive web-based visualization for electric fields and potentials from point charges in 2D space.

## Features

- Interactive charge placement: Add, remove, and configure multiple point charges
- Real-time visualization: Plots showing electric field vectors and equipotential lines
- Point calculator: Calculate field and potential at specific points
- Presets: Quick load dipole, quadrupole, and triangle charge arrangements
- Customizable parameters: Adjust grid bounds, resolution, and softening

## Installation

1. Create a Python virtual environment (recommended) and install dependencies:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Note: creating a public tunnel (ngrok) is optional and not required for this project. If you need a public URL for short-term sharing, use a tunnel tool (ngrok or Cloudflare Tunnel) locally — they are not listed as project dependencies.

## Running the Application (local)

Start the Flask server (defaults to `0.0.0.0:5000`):
```bash
python app.py
```

## Installation & Run (Quick)

These instructions make the project easy to run after cloning or when opened in a workspace.

Linux / macOS (recommended)
```bash
# create + activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# start the app
python app.py
```

Windows (PowerShell)
```powershell
# create + activate venv
python -m venv .venv
.\.venv\Scripts\Activate.ps1


python -m pip install --upgrade pip
pip install -r requirements.txt

**Request body example:**
python app.py
```

Open a browser at:

```
http://localhost:5000
```

Run without a virtualenv (not recommended):
```bash
python -m pip install -r requirements.txt
python app.py
```

Running in a remote workspace / container
- If the project is running inside a remote workspace (GitHub Codespaces, devcontainer, or a cloud IDE) and you need the app accessible from your host browser, start the server bound to all interfaces:
```bash
HOST=0.0.0.0 PORT=5000 python app.py
```
- Then use your workspace's port‑forwarding UI (VS Code, Codespaces, etc.) to open `http://localhost:5000` in your browser.

Note: this project is intended for local development and classroom sharing. No external tunnel or cloud deployment is required.

## Troubleshooting

- Port already in use: if `python app.py` fails because port 5000 is occupied, pick another port:
  ```bash
  PORT=8000 python app.py
  ```
- Server not reachable from host in remote workspace: ensure you started with `HOST=0.0.0.0` and that port forwarding is enabled in your IDE.
- Missing dependencies / import errors: make sure the virtualenv is activated and `pip install -r requirements.txt` completed without errors.

Quick check that server is running locally:
```bash
curl -v http://127.0.0.1:5000/
```

If you see HTML output (HTTP 200) the app is running.
```json
{
  "charges": [{"q": 1e-9, "x": 0, "y": 0}],
  "point": {"x": 1, "y": 0.5},
  "softening": 1e-6
}
```

## Project Structure

```
. 
├── app.py              # Flask web application backend
├── main.py             # Core calculation engine
├── templates/
│   └── index.html      # Web interface HTML
├── static/
│   ├── style.css       # Styling
│   └── script.js       # Frontend JavaScript
└── requirements.txt    # Python dependencies
```

## Notes

- Charges are in Coulombs (C)
- Distances are in meters (m)
- Electric field is in N/C or V/m
- Potential is in Volts (V)
- The softening parameter (ε) prevents singularities at charge locations

If you want, I can add a small section that shows a one-line command to run and print both the local and public URLs automatically on startup.
