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

Open in your browser:

```
http://localhost:5000
```

## Sharing the App

You can share the app in two common ways:

1. Share on your local network

- Run the server binding to all interfaces (default):
  ```bash
  HOST=0.0.0.0 PORT=5000 python app.py
  ```
- Find your machine's local IP (e.g. `192.168.1.42`) and share:
  ```
  http://192.168.1.42:5000
  ```

2. Create a public URL using ngrok (quick and easy)

- Install `ngrok` and set your authtoken (optional but recommended):
  ```bash
  # install pyngrok already in requirements; to use ngrok binary, visit https://ngrok.com/
  export NGROK_AUTHTOKEN="<your-ngrok-token>"
  ```
- Enable the tunnel and run the app (the app will print the public URL):
  ```bash
  export USE_NGROK=1
  python app.py
  ```
- After startup, look for a printed line like:
  ```
  ngrok tunnel established -> https://abcd-1234.ngrok.io
  ```
  Share the printed `https://...ngrok.io` URL — that's the public URL anyone can open.

Which link to share?
- If using ngrok: share the ngrok public URL printed by the app (e.g., `https://abcd-1234.ngrok.io`).
- If on the same local network: share `http://<your-machine-ip>:<PORT>`.

Notes:
- Running with `HOST=0.0.0.0` makes the server reachable from other devices on the same network — ensure your firewall allows the port.
- Ngrok tunnels are temporary (unless you have a paid account with custom domains).

## API Endpoints

### POST /api/calculate
Calculate electric field and potential on a grid.

**Request body example:**
```json
{
  "charges": [{"q": 1e-9, "x": 0, "y": 0}],
  "bounds": {"xmin": -2, "xmax": 2, "ymin": -2, "ymax": 2},
  "resolution": 50,
  "softening": 0.001
}
```

### POST /api/calculate_point
Calculate field and potential at a single point.

**Request body example:**
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
