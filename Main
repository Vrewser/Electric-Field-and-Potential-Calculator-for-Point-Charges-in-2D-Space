  #!/usr/bin/env python3
"""
efield_2d.py

Electric field and potential calculator for point charges in 2D space.

Features:
- Define point charges (q in Coulombs) at (x, y) positions (meters).
- Compute electric field vector E (V/m) and scalar potential V (V) at single points
  or on a grid (vectorized).
- Optional softening parameter to avoid singularities at charge locations.
- Simple plotting helper to visualize vector field and equipotentials using matplotlib.

Dependencies:
- numpy
- matplotlib (only for plotting examples)

Example:
    python efield_2d.py
"""

from dataclasses import dataclass
from typing import Sequence, Tuple, Union, Iterable
import numpy as np

# Optional plotting import used only by the example/visualization functions
try:
    import matplotlib.pyplot as plt
except Exception:
    plt = None  # plotting functions will raise a helpful error if used without matplotlib


# Coulomb constant (N m^2 / C^2)
K = 8.9875517923e9


@dataclass
class Charge:
    q: float
    x: float
    y: float

    @property
    def pos(self) -> np.ndarray:
        return np.array([self.x, self.y], dtype=float)


def _normalize_charges(charges: Iterable[Union[Charge, Tuple[float, float, float]]]) -> Tuple[np.ndarray, np.ndarray]:
    """
    Convert an iterable of Charge objects or (q, x, y) tuples into arrays.
    Returns:
        qs: shape (M,)
        pos: shape (M, 2)
    """
    qs = []
    pos = []
    for c in charges:
        if isinstance(c, Charge):
            qs.append(c.q)
            pos.append([c.x, c.y])
        else:
            # Expect (q, x, y)
            q, x, y = c
            qs.append(q)
            pos.append([x, y])
    return np.array(qs, dtype=float), np.array(pos, dtype=float)


def _prepare_points(points: Union[Sequence[float], np.ndarray]) -> np.ndarray:
    """
    Ensure points is an array of shape (N, 2). Accepts:
     - (2,) for a single point
     - (N, 2) for many points
    """
    pts = np.asarray(points, dtype=float)
    if pts.ndim == 1:
        if pts.size != 2:
            raise ValueError("A single point must have 2 coordinates.")
        pts = pts.reshape(1, 2)
    elif pts.ndim == 2 and pts.shape[1] == 2:
        pass
    else:
        raise ValueError("Points must be shape (2,) or (N, 2).")
    return pts


def electric_field(points: Union[Sequence[float], np.ndarray],
                   charges: Iterable[Union[Charge, Tuple[float, float, float]]],
                   k: float = K,
                   eps: float = 1e-9) -> np.ndarray:
    """
    Compute the electric field vector E at point(s) due to point charges.

    Args:
        points: (2,) or (N,2) array-like of positions where the field is computed (meters).
        charges: iterable of Charge or (q, x, y) tuples. q in Coulombs.
        k: Coulomb constant (default 8.9875517923e9 N m^2 / C^2).
        eps: softening parameter (meters) added in quadrature to distance to avoid singularities.

    Returns:
        E: (N,2) array of electric field vectors (V/m or N/C).
           If a single point was provided, shape will be (1,2).
    """
    pts = _prepare_points(points)
    qs, pos = _normalize_charges(charges)  # qs shape (M,), pos (M,2)

    # vectorized computation:
    # For broadcasting, reshape: pts (N,1,2), pos (1,M,2) -> r (N,M,2)
    r = pts[:, None, :] - pos[None, :, :]         # displacement from charge to field point
    r2 = np.sum(r * r, axis=2) + eps * eps       # squared distance with softening
    r_norm = np.sqrt(r2)                         # distance
    # E contribution: k * q * r / r^3  (vector)
    coeff = k * qs[None, :] / (r2 * r_norm)      # shape (N, M)
    E = np.sum(coeff[:, :, None] * r, axis=1)    # sum over charges -> shape (N,2)
    return E


def potential(points: Union[Sequence[float], np.ndarray],
              charges: Iterable[Union[Charge, Tuple[float, float, float]]],
              k: float = K,
              eps: float = 1e-9) -> np.ndarray:
    """
    Compute the electric potential V at point(s) due to point charges.

    Args:
        points: (2,) or (N,2) positions where potential is computed.
        charges: iterable of Charge or (q, x, y) tuples.
        k: Coulomb constant.
        eps: softening parameter.

    Returns:
        V: (N,) array of scalar potentials in volts. Single point -> shape (1,)
    """
    pts = _prepare_points(points)
    qs, pos = _normalize_charges(charges)
    r = pts[:, None, :] - pos[None, :, :]
    r2 = np.sum(r * r, axis=2) + eps * eps
    r_norm = np.sqrt(r2)
    V = np.sum(k * qs[None, :] / r_norm, axis=1)
    return V


def compute_grid(xmin: float, xmax: float, ymin: float, ymax: float, nx: int = 200, ny: int = 200) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Create a 2D grid of points for visualization.

    Returns:
        X, Y meshgrids and points array of shape (nx*ny, 2)
    """
    xs = np.linspace(xmin, xmax, nx)
    ys = np.linspace(ymin, ymax, ny)
    X, Y = np.meshgrid(xs, ys)
    pts = np.column_stack([X.ravel(), Y.ravel()])  # shape (nx*ny, 2)
    return X, Y, pts


def plot_field_and_potential(charges: Iterable[Union[Charge, Tuple[float, float, float]]],
                             bounds: Tuple[float, float, float, float] = (-1.5, 1.5, -1.5, 1.5),
                             density: int = 24,
                             eq_levels: int = 20,
                             softening: float = 1e-3,
                             figsize: Tuple[int, int] = (8, 8),
                             show_charges: bool = True):
    """
    Convenience function that plots the electric field (quiver) and equipotential lines.

    Args:
        charges: iterable of charges
        bounds: (xmin, xmax, ymin, ymax)
        density: number of arrows along each axis for quiver (total ~ density^2)
        eq_levels: number of equipotential contour levels
        softening: eps passed to compute field/potential (meters)
    """
    if plt is None:
        raise RuntimeError("matplotlib is required for plotting. Install it with `pip install matplotlib`.")

    xmin, xmax, ymin, ymax = bounds
    # for field arrows use coarser grid
    Xq, Yq, pts_q = compute_grid(xmin, xmax, ymin, ymax, nx=density, ny=density)
    E_q = electric_field(pts_q, charges, eps=softening)
    Ex = E_q[:, 0].reshape(Xq.shape)
    Ey = E_q[:, 1].reshape(Yq.shape)

    # for potential use finer grid for smooth contours
    Xc, Yc, pts_c = compute_grid(xmin, xmax, ymin, ymax, nx=300, ny=300)
    Vc = potential(pts_c, charges, eps=softening).reshape(Xc.shape)

    fig, ax = plt.subplots(figsize=figsize)
    ax.set_xlabel("x (m)")
    ax.set_ylabel("y (m)")
    ax.set_aspect('equal')

    # Equipotential contours
    cs = ax.contour(Xc, Yc, Vc, levels=eq_levels, cmap='coolwarm', linewidths=0.8)
    ax.clabel(cs, inline=True, fontsize=8, fmt="%.2e")

    # Quiver (electric field). We may want to normalize arrows for visibility.
    mag = np.hypot(Ex, Ey)
    # avoid dividing by zero
    mag_nozero = np.where(mag == 0, 1.0, mag)
    Ex_n = Ex / mag_nozero
    Ey_n = Ey / mag_nozero
    ax.quiver(Xq, Yq, Ex_n, Ey_n, mag, cmap='inferno', scale=30, width=0.006)

    if show_charges:
        qs, pos = _normalize_charges(charges)
        for q, (x, y) in zip(qs, pos):
            if q > 0:
                ax.scatter([x], [y], color='r', s=80, marker='+', label='positive' if 'positive' not in ax.get_legend_handles_labels()[1] else "")
            else:
                ax.scatter([x], [y], color='b', s=80, marker='o', facecolors='none', label='negative' if 'negative' not in ax.get_legend_handles_labels()[1] else "")
    ax.legend(loc='upper right')
    ax.set_title("Electric field (normalized arrows) and equipotential lines")
    plt.tight_layout()
    plt.show()


# Small demonstration / CLI example
if __name__ == "__main__":
    # Example configuration: electric dipole
    charges_example = [
        Charge(q=1e-9, x=-0.5, y=0.0),   # +1 nC at (-0.5, 0)
        Charge(q=-1e-9, x=0.5, y=0.0),   # -1 nC at (+0.5, 0)
    ]

    # Compute field and potential at a single point
    pt = (0.0, 0.2)
    E_pt = electric_field(pt, charges_example, eps=1e-6)[0]  # returns (1,2) -> take [0]
    V_pt = potential(pt, charges_example, eps=1e-6)[0]
    print(f"At point {pt}: E = ({E_pt[0]:.3e}, {E_pt[1]:.3e}) N/C ; |E| = {np.hypot(*E_pt):.3e} N/C")
    print(f"At point {pt}: V = {V_pt:.3e} V")

    # Compute on a small grid and print shape (example)
    X, Y, pts = compute_grid(-1.5, 1.5, -1.5, 1.5, nx=41, ny=41)
    E_grid = electric_field(pts, charges_example, eps=1e-6)
    V_grid = potential(pts, charges_example, eps=1e-6)
    print(f"Computed E on grid of shape {X.shape} (flattened points: {pts.shape[0]})")

    # Plot (requires matplotlib)
    try:
        plot_field_and_potential(charges_example, bounds=(-1.5, 1.5, -1.5, 1.5), density=24, eq_levels=30, softening=1e-3)
    except RuntimeError as e:
        print(str(e))
