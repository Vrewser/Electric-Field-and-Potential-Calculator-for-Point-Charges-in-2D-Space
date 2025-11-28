#!/usr/bin/env python3
"""
Flask web application for electric field and potential visualization.
"""

from flask import Flask, render_template, request, jsonify
import os
from main import Charge, electric_field, potential, compute_grid
import numpy as np
import json

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/calculate', methods=['POST'])
def calculate():
    """
    Calculate electric field and potential for given charges and grid parameters.
    
    Expected JSON:
    {
        "charges": [{"q": float, "x": float, "y": float}, ...],
        "bounds": {"xmin": float, "xmax": float, "ymin": float, "ymax": float},
        "resolution": int,
        "softening": float
    }
    """
    try:
        data = request.json
        charges_data = data.get('charges', [])
        bounds = data.get('bounds', {'xmin': -2, 'xmax': 2, 'ymin': -2, 'ymax': 2})
        resolution = data.get('resolution', 50)
        softening = data.get('softening', 1e-3)
        
        # Create charge objects
        charges = [Charge(q=c['q'], x=c['x'], y=c['y']) for c in charges_data]
        
        if not charges:
            return jsonify({'error': 'No charges provided'}), 400
        
        # Compute grid
        X, Y, pts = compute_grid(
            bounds['xmin'], bounds['xmax'],
            bounds['ymin'], bounds['ymax'],
            nx=resolution, ny=resolution
        )
        
        # Calculate field and potential
        E = electric_field(pts, charges, eps=softening)
        V = potential(pts, charges, eps=softening)
        
        # Reshape for output
        Ex = E[:, 0].reshape(X.shape).tolist()
        Ey = E[:, 1].reshape(Y.shape).tolist()
        V_grid = V.reshape(X.shape).tolist()
        
        return jsonify({
            'X': X.tolist(),
            'Y': Y.tolist(),
            'Ex': Ex,
            'Ey': Ey,
            'V': V_grid,
            'charges': charges_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/calculate_point', methods=['POST'])
def calculate_point():
    """
    Calculate field and potential at a single point.
    
    Expected JSON:
    {
        "charges": [{"q": float, "x": float, "y": float}, ...],
        "point": {"x": float, "y": float},
        "softening": float
    }
    """
    try:
        data = request.json
        charges_data = data.get('charges', [])
        point = data.get('point', {'x': 0, 'y': 0})
        softening = data.get('softening', 1e-6)
        
        charges = [Charge(q=c['q'], x=c['x'], y=c['y']) for c in charges_data]
        
        if not charges:
            return jsonify({'error': 'No charges provided'}), 400
        
        pt = (point['x'], point['y'])
        E_pt = electric_field(pt, charges, eps=softening)[0]
        V_pt = potential(pt, charges, eps=softening)[0]
        
        return jsonify({
            'point': point,
            'E': {'x': float(E_pt[0]), 'y': float(E_pt[1])},
            'E_magnitude': float(np.hypot(E_pt[0], E_pt[1])),
            'V': float(V_pt)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # Read host/port/debug configuration from environment so the server
    # can be started in a development environment or workspace.
    host = os.getenv('HOST', '127.0.0.1')
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'True').lower() in ('1', 'true', 'yes')

    # Start the Flask development server. For local development open
    # http://localhost:5000 in your browser. If you run this in a remote
    # workspace and want to expose the port, set HOST=0.0.0.0 when starting.
    app.run(debug=debug, host=host, port=port)
