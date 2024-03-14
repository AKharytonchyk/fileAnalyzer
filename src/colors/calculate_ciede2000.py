from skimage.color import rgb2lab, deltaE_ciede2000
import numpy as np
import sys

def hex_to_rgb(hex_color):
    """
    Convert a hexadecimal color string to an RGB tuple.
    Args:
    - hex_color: The hexadecimal color string.
    Returns:
    - A tuple representing the RGB values.
    """
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_lab(color_rgb):
    """
    Convert an RGB color to LAB color space using skimage.
    Args:
    - color_rgb: The RGB color as a tuple or list of three elements.
    Returns:
    - The color in LAB color space as a numpy array.
    """
    # Normalize the RGB values to the range 0-1
    color_rgb_normalized = np.array(color_rgb) / 255.0
    # Convert to LAB and return
    return rgb2lab(np.array([color_rgb_normalized.reshape((1, 1, 3))]))[0]

def delta_e_cie2000(color1_lab, color2_lab):
    """
    Calculate the CIEDE2000 color difference between two colors in LAB color space.
    Args:
    - color1_lab: The first color in LAB color space.
    - color2_lab: The second color in LAB color space.
    Returns:
    - Delta E (CIEDE2000): The color difference as a float.
    """
    return deltaE_ciede2000(color1_lab, color2_lab)

if __name__ == "__main__":
    # Parse command line arguments for hexadecimal colors
    color1_hex = sys.argv[1]
    color2_hex = sys.argv[2]

    # Convert hex colors to RGB tuples
    color1_rgb = hex_to_rgb(color1_hex)
    color2_rgb = hex_to_rgb(color2_hex)

    # Convert RGB colors to LAB
    color1_lab = rgb_to_lab(color1_rgb)
    color2_lab = rgb_to_lab(color2_rgb)

    # Calculate and print the CIEDE2000 color difference
    print(f"Delta E (CIE2000): {delta_e_cie2000(color1_lab, color2_lab)}")

"""
ΔE < 1.0: Not perceptible by human eyes.
1 ≤ ΔE < 2: Perceptible through close observation.
2 ≤ ΔE < 10: Perceptible at a glance. Differences become more apparent, especially for design elements that are close together.
10 ≤ ΔE < 50: Colors are more distinctly different. Such differences are obvious at a glance and would be considered significant changes in a UI color scheme.
ΔE ≥ 50: Colors are different, not just in terms of hue but possibly in saturation and lightness too. This is a very substantial change.
"""
