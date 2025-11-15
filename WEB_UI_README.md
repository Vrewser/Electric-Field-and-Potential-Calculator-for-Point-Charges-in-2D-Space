# Electric Field & Potential Calculator - Web UI

Interactive web-based visualization for electric fields and potentials from point charges in 2D space.

## Features

- **Interactive charge placement**: Add, remove, and configure multiple point charges
- **Real-time visualization**: Beautiful plots showing electric field vectors and equipotential lines
- **Point calculator**: Calculate field and potential at specific points
- **Preset configurations**: Quick load dipole, quadrupole, and triangle charge arrangements
- **Customizable parameters**: Adjust grid bounds, resolution, and softening parameters

## Installation

1. Install the required dependencies:
```bash
pip install Flask numpy matplotlib
```

## Running the Application

1. Start the Flask web server:
```bash
python app.py
```

2. Open your web browser and navigate to:
```
http://localhost:5000
```

## Usage

### Adding Charges

1. Click "Add Charge" to add a new point charge
2. Configure the charge properties:
   - **q**: Charge in Coulombs (e.g., 1e-9 for 1 nanocoulomb)
   - **x, y**: Position in meters

### Visualization

1. Set your desired grid bounds and resolution
2. Click "Calculate & Visualize" to generate the plot
3. Toggle field vectors and equipotential lines using checkboxes

### Point Calculator

1. Enter x and y coordinates for a specific point
2. Click "Calculate at Point" to see the electric field and potential values

### Presets

Quick load common charge configurations:
- **Electric Dipole**: Two opposite charges
- **Quadrupole**: Four charges in a square
- **Triangle**: Three equal charges in a triangle

## Project Structure

```
.
├── app.py              # Flask web application backend
├── Main                # Core calculation engine
├── templates/
│   └── index.html     # Web interface HTML
├── static/
│   ├── style.css      # Styling
│   └── script.js      # Frontend JavaScript
└── requirements.txt   # Python dependencies
```

## API Endpoints

### POST /api/calculate
Calculate electric field and potential on a grid.

**Request body:**
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

**Request body:**
```json
{
  "charges": [{"q": 1e-9, "x": 0, "y": 0}],
  "point": {"x": 1, "y": 0.5},
  "softening": 1e-6
}
```

## Original Command Line Tool

The original command-line calculator is still available in the `Main` file:

```bash
python Main
```

## Notes

- Charges are in Coulombs (C)
- Distances are in meters (m)
- Electric field is in N/C or V/m
- Potential is in Volts (V)
- The softening parameter (ε) prevents singularities at charge locations
