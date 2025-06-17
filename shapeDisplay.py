import numpy as np
import matplotlib.pyplot as plt
import itertools

def rotate_polygon(vertices, angle):
    """Rotate a polygon around the first point by the given angle in degrees."""
    # Convert angle to radians
    angle_rad = np.radians(angle)
    
    # Get the first vertex (origin for rotation)
    origin = vertices[0]
    
    # Create a rotation matrix
    rotation_matrix = np.array([[np.cos(angle_rad), -np.sin(angle_rad)],
                                [np.sin(angle_rad), np.cos(angle_rad)]])
    
    # Translate vertices to origin, rotate, then translate back
    rotated_vertices = []
    for vertex in vertices:
        translated_vertex = np.array(vertex) - origin
        rotated_vertex = rotation_matrix @ translated_vertex
        rotated_vertices.append(rotated_vertex + origin)
    
    return np.array(rotated_vertices)

def kite_points(L):
    C = L * np.sin(np.radians(15)) 

    P1 = np.array([0, 0])
    P2 = np.array([C, L])
    P3 = np.array([L, L])
    P4 = np.array([L, C])

    return [P1, P2, P3, P4]

def trig_points(L):
    C = L * np.sin(np.radians(15)) 

    P1 = np.array([0, 0])
    P2 = np.array([-C, L])
    P3 = np.array([C, L])

    return [P1, P2, P3]

def display_polygons(polygons, size, title):
    plt.figure()
    plt.xlim(-size, size)
    plt.ylim(-size, size)
    
    for polygon in polygons:
        polygon = np.vstack([polygon, polygon[0]])  # Close the polygon loop
        xs, ys = zip(*polygon)
        plt.plot(xs, ys, marker='o')
    
    plt.gca().set_aspect('equal', adjustable='box')
    plt.show()

def render_shape(shape_string, angleOffset, L):
    polygons = []
    angle = angleOffset
    for char in shape_string:
        if char == 'B':
            polygons.append(rotate_polygon(kite_points(L), angle + 60))
            angle += 60
        elif char == 'S':
            polygons.append(rotate_polygon(trig_points(L), angle))
            angle += 30
        else:
            print("Bad shape.")
            return []
    return polygons

# Generate all permutations given a number of big and small pieces
def generate_shapestrings(B, S):
    bitstring = ['B'] * B + ['S'] * S
    
    unique_bitstrings = set(itertools.permutations(bitstring))
    
    return [''.join(bits) for bits in unique_bitstrings]

# Generate all possible permutations of big and small pieces
def generate_all_shapestrings():
    # 2,8  3,6  4,4  5,2  6,0
    all_bitstrings = []
    for i in range(2, 7):
        all_bitstrings.extend(generate_shapestrings(i, 10 - i))
    return all_bitstrings

# Check if any rotation exists in the set of bitstrings
def exists_equivalent_bitstring_rotation(bitstring, bitstring_set):
    rotations = [bitstring[i:] + bitstring[:i] for i in range(len(bitstring))]
    return any(rotation in bitstring_set for rotation in rotations)

# Check if any mirroring exists in the set of bitstrings
def exists_equivalent_bitstring_mirror(bitstring, bitstring_set):
    return exists_equivalent_bitstring_rotation(bitstring, bitstring_set) or exists_equivalent_bitstring_rotation(bitstring[::-1], bitstring_set)


def display_all_known_shapes(shape_set):
    for shape in shape_set:
        display_polygons(render_shape(shape[0], shape[1], 1), 2.5, shape[3])

# bitstring, angle offset for 'upright', indices from starting poly/line of lines of division (starts at 0), name, short name
sh_square = ["SBSBSBSB", 0, [0, 3, 6, 8], "square", "S"]
sh_golem = ["SBSBBSBS", 15, [0, 3, 6, 9], "golem?", "G"]
sh_emblem = ["BBSSBSSB", -15, [1, 3, 5, 7, 9, 11], "emblem", "E"]
sh_eye_true = ["SBSSSSBSSS", 45, [0, 1, 2, 4, 5, 6, 7, 8, 10, 11], "true eye", "Etr", ]

sh_shield_curved = ["BBSSSBSSS", -45, [2, 3, 4, 8, 9, 10], "curved shueld", "Shc"]

# 2 big only
sh_orb = ["BBSSSSSSSS", 135, [0, 2, 3, 4, 5, 6, 7, 8, 9, 10], "orb", "Orb"]
sh_dome = ["BSBSSSSSSS", 120, [0, 2, 3, 4, 5, 6, 7, 8, 9, 11], "dome", "Dm"]
sh_beetle = ["SSSBSSSBSS", 0, [0, 1, 3, 4, 5, 6, 7, 8, 10, 11], "beetle", "Bt"]

shape_set = []

shape_set.append(sh_square)
shape_set.append(sh_golem)
shape_set.append(sh_emblem)
shape_set.append(sh_eye_true)
shape_set.append(sh_shield_curved)
shape_set.append(sh_orb)
shape_set.append(sh_dome)
shape_set.append(sh_beetle)

shapestring_set = set()
for s in shape_set:
    shapestring_set.add(s[0])


# TODO
# Add all known shapes to quick reference dict ("E" -> sh_emblem)
# generate all bitstrings, render the first one without a name (not in the dict)


# display_all_known_shapes(shape_set)

all_shapestrings = generate_all_shapestrings()
for shapestring in all_shapestrings:
    if not exists_equivalent_bitstring_rotation(shapestring, shapestring_set):
        display_polygons(render_shape(shapestring, 0, 1), 2.5, "unknown shape")


polygons = render_shape(sh_square[0], sh_square[1], 1)

display_polygons(polygons, 2.5, "square")
