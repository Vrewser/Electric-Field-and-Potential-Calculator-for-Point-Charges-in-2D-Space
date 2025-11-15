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
        charge[field] = parseFloat(value);
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
        
        // Create quiver-like effect with cones
        for (let i = 0; i < X_sub.length; i++) {
            traces.push({
                type: 'scatter',
                x: [X_sub[i], X_sub[i] + U_sub[i] * 0.1],
                y: [Y_sub[i], Y_sub[i] + V_sub[i] * 0.1],
                mode: 'lines',
                line: {
                    color: 'rgba(255, 140, 0, 0.6)',
                    width: 1
                },
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
        showlegend: true,
        legend: {
            x: 1.2,
            y: 0.5
        },
        margin: { l: 60, r: 200, t: 80, b: 60 }
    };
    
    Plotly.newPlot('plot', traces, layout, { responsive: true });
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
