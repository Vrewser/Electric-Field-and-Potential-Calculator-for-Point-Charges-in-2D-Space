let charges = [];
let currentData = null;

// Initialize with dipole example
window.onload = function() {
    loadDipole();
    calculate();
};

function addCharge(q = 1e-9, x = 0, y = 0) {
    const id = Date.now();
    charges.push({ id, q, x, y });
    renderCharges();
}

function removeCharge(id) {
    charges = charges.filter(c => c.id !== id);
    renderCharges();
}

function updateCharge(id, field, value) {
    const charge = charges.find(c => c.id === id);
    if (charge) {
        // Parse numeric input safely; if parsing fails, leave the existing value
        const parsed = parseFloat(value);
        if (!isNaN(parsed)) {
            charge[field] = parsed;
        } else {
            // fallback: assign raw value (shouldn't usually happen for number inputs)
            charge[field] = value;
        }
        // Re-render the charges list so classes/labels update (positive vs negative)
        renderCharges();
    }
}

function renderCharges() {
    const container = document.getElementById('charges-list');
    if (charges.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No charges added yet</p>';
        return;
    }
    
    container.innerHTML = charges.map((charge, index) => {
        const type = charge.q >= 0 ? 'positive' : 'negative';
        const sign = charge.q >= 0 ? '+' : '';
        return `
            <div class="charge-item ${type}">
                <div class="charge-header">
                    <h4>Charge ${index + 1} (${charge.q >= 0 ? 'Positive' : 'Negative'})</h4>
                    <button class="btn-remove" onclick="removeCharge(${charge.id})">Remove</button>
                </div>
                <div class="charge-controls">
                    <label style="margin: 0;">
                        q (C):
                        <input type="number" value="${charge.q}" step="1e-10" 
                               onchange="updateCharge(${charge.id}, 'q', this.value)">
                    </label>
                    <label style="margin: 0;">
                        x (m):
                        <input type="number" value="${charge.x}" step="0.1" 
                               onchange="updateCharge(${charge.id}, 'x', this.value)">
                    </label>
                </div>
                <label style="margin: 0;">
                    y (m):
                    <input type="number" value="${charge.y}" step="0.1" 
                           onchange="updateCharge(${charge.id}, 'y', this.value)">
                </label>
            </div>
        `;
    }).join('');
}

function loadDipole() {
    charges = [
        { id: Date.now(), q: 1e-9, x: -0.5, y: 0 },
        { id: Date.now() + 1, q: -1e-9, x: 0.5, y: 0 }
    ];
    renderCharges();
}

function loadQuadrupole() {
    charges = [
        { id: Date.now(), q: 1e-9, x: -0.5, y: -0.5 },
        { id: Date.now() + 1, q: -1e-9, x: 0.5, y: -0.5 },
        { id: Date.now() + 2, q: -1e-9, x: -0.5, y: 0.5 },
        { id: Date.now() + 3, q: 1e-9, x: 0.5, y: 0.5 }
    ];
    renderCharges();
}

function loadTriangle() {
    charges = [
        { id: Date.now(), q: 1e-9, x: 0, y: 0.8 },
        { id: Date.now() + 1, q: 1e-9, x: -0.7, y: -0.4 },
        { id: Date.now() + 2, q: 1e-9, x: 0.7, y: -0.4 }
    ];
    renderCharges();
}

function clearCharges() {
    charges = [];
    renderCharges();
}

function updateResolutionLabel() {
    const value = document.getElementById('resolution').value;
    document.getElementById('resolution-value').textContent = value;
}

async function calculate() {
    if (charges.length === 0) {
        alert('Please add at least one charge');
        return;
    }

    const loading = document.getElementById('loading');
    const plot = document.getElementById('plot');
    
    loading.style.display = 'block';
    
    const bounds = {
        xmin: parseFloat(document.getElementById('xmin').value),
        xmax: parseFloat(document.getElementById('xmax').value),
        ymin: parseFloat(document.getElementById('ymin').value),
        ymax: parseFloat(document.getElementById('ymax').value)
    };
    
    const resolution = parseInt(document.getElementById('resolution').value);
    const softening = parseFloat(document.getElementById('softening').value);
    
    try {
        const response = await fetch('/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                charges: charges,
                bounds: bounds,
                resolution: resolution,
                softening: softening
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            alert('Error: ' + data.error);
            return;
        }
        
        currentData = data;
        updateVisualization();
        
    } catch (error) {
        alert('Error calculating: ' + error.message);
    } finally {
        loading.style.display = 'none';
    }
}

function updateVisualization() {
    if (!currentData) return;
    
    const showField = document.getElementById('show-field').checked;
    const showPotential = document.getElementById('show-potential').checked;
    const showLines = document.getElementById('show-lines') ? document.getElementById('show-lines').checked : false;
    const linesPerCharge = document.getElementById('lines-per-charge') ? parseInt(document.getElementById('lines-per-charge').value) : 12;
    const lineStep = document.getElementById('line-step') ? parseFloat(document.getElementById('line-step').value) : 0.05;
    const lineStepsMax = document.getElementById('line-steps-max') ? parseInt(document.getElementById('line-steps-max').value) : 1000;
    
    const traces = [];
    
    // Add equipotential contours
    if (showPotential) {
        traces.push({
            type: 'contour',
            x: currentData.X[0],
            y: currentData.Y.map(row => row[0]),
            z: currentData.V,
            colorscale: 'RdBu',
            reversescale: true,
            contours: {
                coloring: 'lines',
                showlabels: true
            },
            line: {
                width: 1.5
            },
            name: 'Potential (V)',
            showscale: true,
            colorbar: {
                title: 'V (Volts)',
                x: 1.15
            }
        });
    }
    
    // Add electric field vectors
    if (showField) {
        // Subsample for quiver plot
        const skip = 2;
        const X_sub = [];
        const Y_sub = [];
        const U_sub = [];
        const V_sub = [];
        
        for (let i = 0; i < currentData.X.length; i += skip) {
            for (let j = 0; j < currentData.X[0].length; j += skip) {
                X_sub.push(currentData.X[i][j]);
                Y_sub.push(currentData.Y[i][j]);
                
                const Ex = currentData.Ex[i][j];
                const Ey = currentData.Ey[i][j];
                const mag = Math.sqrt(Ex*Ex + Ey*Ey);
                
                // Normalize for visibility
                U_sub.push(mag > 0 ? Ex / mag : 0);
                V_sub.push(mag > 0 ? Ey / mag : 0);
            }
        }
        
        // Create quiver-like arrows: a shaft plus two small head segments per vector
        for (let i = 0; i < X_sub.length; i++) {
            const bx = X_sub[i];
            const by = Y_sub[i];
            const ux = U_sub[i];
            const uy = V_sub[i];
            // tip of the arrow (scale the normalized vector for visibility)
            const tipScale = 0.1;
            const tx = bx + ux * tipScale;
            const ty = by + uy * tipScale;

            // shaft
            traces.push({
                type: 'scatter',
                x: [bx, tx],
                y: [by, ty],
                mode: 'lines',
                line: {
                    color: 'rgba(255, 140, 0, 0.6)',
                    width: 1
                },
                showlegend: false,
                hoverinfo: 'skip'
            });

            // arrowhead (two small lines forming a V)
            const angle = Math.atan2(uy, ux);
            const headAngle = Math.PI / 7; // ~25 degrees
            const headLen = 0.03; // length of arrowhead segments

            const hx1 = tx - Math.cos(angle - headAngle) * headLen;
            const hy1 = ty - Math.sin(angle - headAngle) * headLen;
            const hx2 = tx - Math.cos(angle + headAngle) * headLen;
            const hy2 = ty - Math.sin(angle + headAngle) * headLen;

            traces.push({
                type: 'scatter',
                x: [tx, hx1],
                y: [ty, hy1],
                mode: 'lines',
                line: { color: 'rgba(255, 140, 0, 0.6)', width: 1 },
                showlegend: false,
                hoverinfo: 'skip'
            });

            traces.push({
                type: 'scatter',
                x: [tx, hx2],
                y: [ty, hy2],
                mode: 'lines',
                line: { color: 'rgba(255, 140, 0, 0.6)', width: 1 },
                showlegend: false,
                hoverinfo: 'skip'
            });
        }
    }
    
    // Add charge markers
    currentData.charges.forEach(charge => {
        traces.push({
            type: 'scatter',
            x: [charge.x],
            y: [charge.y],
            mode: 'markers',
            marker: {
                size: 15,
                color: charge.q > 0 ? 'red' : 'blue',
                symbol: charge.q > 0 ? 'cross' : 'circle',
                line: {
                    color: charge.q > 0 ? 'darkred' : 'darkblue',
                    width: 2
                }
            },
            name: `Charge: ${charge.q.toExponential(2)} C`,
            showlegend: true
        });
    });

    // Field lines (numerical integration) - drawn last so they appear under the charges
    if (showLines && currentData.charges.length > 0) {
        const bounds = {
            xmin: currentData.X[0][0],
            xmax: currentData.X[0][currentData.X[0].length - 1],
            ymin: currentData.Y[0][0],
            ymax: currentData.Y[currentData.Y.length - 1][0]
        };
        const fieldLineTraces = generateFieldLines(currentData.charges, linesPerCharge, lineStep, lineStepsMax, bounds);
        fieldLineTraces.forEach(t => traces.push(t));
    }
    
    const layout = {
        title: {
            text: 'Electric Field and Potential Distribution',
            font: { size: 20 }
        },
        xaxis: {
            title: 'x (meters)',
            scaleanchor: 'y',
            scaleratio: 1
        },
        yaxis: {
            title: 'y (meters)'
        },
        hovermode: 'closest',
        /* Allow click-and-drag panning */
        dragmode: 'pan',
        showlegend: true,
        legend: {
            x: 1.2,
            y: 0.5
        },
        margin: { l: 60, r: 200, t: 80, b: 60 }
    };

    // Enable scroll-wheel zooming via config.scrollZoom and keep responsive layout
    const config = {
        responsive: true,
        scrollZoom: true,
        displayModeBar: true
    };

    Plotly.newPlot('plot', traces, layout, config);
}

// Compute electric field vector at (x,y) from charges (in JS) -- returns {Ex, Ey}
function fieldAtPoint(x, y, charges, eps = 1e-6) {
    let Ex = 0, Ey = 0;
    for (let i = 0; i < charges.length; i++) {
        const c = charges[i];
        const dx = x - c.x;
        const dy = y - c.y;
        const r2 = dx*dx + dy*dy + eps*eps;
        const r = Math.sqrt(r2);
        if (r === 0) continue;
        const coeff = c.q / (r2 * r); // omit Coulomb constant (only direction matters)
        Ex += coeff * dx;
        Ey += coeff * dy;
    }
    return { Ex, Ey };
}

// Numerically integrate field lines starting around each charge
function generateFieldLines(charges, linesPerCharge, step, maxSteps, bounds) {
    const traces = [];
    const kSeedRadius = Math.max(step * 1.5, 0.05);

    // helper to stop when outside bounds
    function outOfBounds(x, y) {
        return x < bounds.xmin || x > bounds.xmax || y < bounds.ymin || y > bounds.ymax;
    }

    // for each charge create seeds around it
    for (let ci = 0; ci < charges.length; ci++) {
        const c = charges[ci];
        const sign = Math.sign(c.q) >= 0 ? 1 : -1;
        for (let n = 0; n < linesPerCharge; n++) {
            const theta = (2 * Math.PI * n) / linesPerCharge;
            const sx = c.x + kSeedRadius * Math.cos(theta);
            const sy = c.y + kSeedRadius * Math.sin(theta);

            // integrate forward
            let pathX = [sx], pathY = [sy];
            let x = sx, y = sy;
            for (let stepIdx = 0; stepIdx < maxSteps; stepIdx++) {
                // compute field
                const f = fieldAtPoint(x, y, charges);
                let Ex = f.Ex, Ey = f.Ey;
                const mag = Math.hypot(Ex, Ey);
                if (mag === 0) break;
                // direction depends on charge sign: field lines originate on positive charges and terminate on negative charges
                // to get the correct orientation, move along field (direction of E)
                Ex /= mag; Ey /= mag;
                // advance
                x = x + Ex * step;
                y = y + Ey * step;
                pathX.push(x); pathY.push(y);
                if (outOfBounds(x, y)) break;
                // stop if very close to any charge
                let close = false;
                for (let j = 0; j < charges.length; j++) {
                    const cj = charges[j];
                    const dx = x - cj.x, dy = y - cj.y;
                    if (Math.hypot(dx, dy) < step * 0.8) { close = true; break; }
                }
                if (close) break;
            }
                if (pathX.length > 2) {
                traces.push({
                    x: pathX,
                    y: pathY,
                    mode: 'lines',
                    line: { color: c.q > 0 ? 'rgba(220,20,60,0.9)' : 'rgba(30,144,255,0.9)', width: 1.5 },
                    hoverinfo: 'skip',
                    showlegend: false
                });
            }

            // integrate backward (opposite direction) to get complete line
            pathX = [sx]; pathY = [sy];
            x = sx; y = sy;
            for (let stepIdx = 0; stepIdx < maxSteps; stepIdx++) {
                const f = fieldAtPoint(x, y, charges);
                let Ex = f.Ex, Ey = f.Ey;
                const mag = Math.hypot(Ex, Ey);
                if (mag === 0) break;
                Ex /= mag; Ey /= mag;
                x = x - Ex * step;
                y = y - Ey * step;
                pathX.push(x); pathY.push(y);
                if (outOfBounds(x, y)) break;
                let close = false;
                for (let j = 0; j < charges.length; j++) {
                    const cj = charges[j];
                    const dx = x - cj.x, dy = y - cj.y;
                    if (Math.hypot(dx, dy) < step * 0.8) { close = true; break; }
                }
                if (close) break;
            }
            if (pathX.length > 2) {
                traces.push({
                    x: pathX,
                    y: pathY,
                    mode: 'lines',
                    line: { color: c.q > 0 ? 'rgba(220,20,60,0.9)' : 'rgba(30,144,255,0.9)', width: 1.5 },
                    hoverinfo: 'skip',
                    showlegend: false
                });
            }
        }
    }
    return traces;
}

async function calculatePoint() {
    if (charges.length === 0) {
        alert('Please add at least one charge');
        return;
    }
    
    const x = parseFloat(document.getElementById('point-x').value);
    const y = parseFloat(document.getElementById('point-y').value);
    const softening = parseFloat(document.getElementById('softening').value);
    
    try {
        const response = await fetch('/api/calculate_point', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                charges: charges,
                point: { x, y },
                softening: softening
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            alert('Error: ' + data.error);
            return;
        }
        
        const results = document.getElementById('point-results');
        results.innerHTML = `
            <strong>Point:</strong> (${x.toFixed(3)}, ${y.toFixed(3)}) m<br>
            <strong>Electric Field:</strong><br>
            &nbsp;&nbsp;Ex = ${data.E.x.toExponential(3)} N/C<br>
            &nbsp;&nbsp;Ey = ${data.E.y.toExponential(3)} N/C<br>
            &nbsp;&nbsp;|E| = ${data.E_magnitude.toExponential(3)} N/C<br>
            <strong>Potential:</strong><br>
            &nbsp;&nbsp;V = ${data.V.toExponential(3)} V
        `;
        results.classList.add('visible');
        
    } catch (error) {
        alert('Error calculating: ' + error.message);
    }
}
