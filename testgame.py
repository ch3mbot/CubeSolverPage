import random
import pygame
import sys

from collections import deque

# White, Yellow and Orange, Blue, Red, Green 
# unknown number, code, better code ig? pieces? idk
PWOB = [0, "AA", "WOB"]
PSWB = [1, "a", "WB"]
PWBR = [0, "BB", "WBR"]
PSWR = [1, "b", "WR"]
PWRG = [0, "CC", "WRG"]
PSWG = [1, "c", "WG"]
PWGO = [0, "DD", "WGO"]
PSWO = [1, "d", "WO"]

PSYR = [1, "e", "YR"]
PYBR = [0, "EE", "YBR"]
PSYB = [1, "f", "YB"]
PYOB = [0, "FF", "YOB"]
PSYO = [1, "g", "YO"]
PYGO = [0, "GG", "YGO"]
PSYG = [1, "h", "YG"]
PYRG = [0, "HH", "YRG"]

pieces_large_white = [PWOB, PWBR, PWRG, PWGO]
pieces_small_white = [PSWB, PSWR, PSWG, PSWO]
pieces_large_yllow = [PYOB, PYBR, PYRG, PYGO]
pieces_small_yllow = [PSYB, PSYR, PSYG, PSYO]

pieces_large = [PWOB, PWBR, PWRG, PWGO, PYOB, PYBR, PYRG, PYGO]
pieces_small = [PSWB, PSWR, PSWG, PSWO, PSYB, PSYR, PSYG, PSYO]

pieces_white = [PWOB, PSWB, PWBR, PSWR, PWRG, PSWG, PWGO, PSWO]
pieces_yllow = [PYOB, PSYB, PYBR, PSYR, PYRG, PSYG, PYGO, PSYO]

all_pieces = [PWOB, PWBR, PWRG, PWGO, PYOB, PYBR, PYRG, PYGO, PSWB, PSWR, PSWG, PSWO, PSYB, PSYR, PSYG, PSYO]

piece_codex = { code: meaning for _, code, meaning in all_pieces }

piece_decodex = { meaning: code for _, code, meaning in all_pieces }

def face_from_meaning(s: str, decodex: dict) -> str:
    parts = s.split(',')
    mapped_parts = [decodex.get(part, part) for part in parts]
    return ''.join(mapped_parts)

print(face_from_meaning("WGO,YG,WOB,YR,WO,YEG,WR,WRG", piece_decodex))

def decode_face_string(s: str, codex: dict) -> str:
    i = 0
    decoded_parts = []
    while i < len(s):
        # check for pair if two or more chars left
        if i + 1 < len(s):
            pair = s[i:i+2]
            if pair in codex:
                decoded_parts.append(codex[pair])
                i += 2
                continue
        # try and decode single char
        char = s[i]
        if char in codex:
            decoded_parts.append(codex[char])
            i += 1
        else:
            s = s[1:] + s[0]
    return ".".join(decoded_parts)



class CubeState:
    def __init__(self, top_face: str, bot_face: str, top_rot: int = 0, bot_rot: int = 0):
        self.top_face = top_face            # e.g., "RGBY" — order of top pieces
        self.bot_face = bot_face      # e.g., "YGBR" — order of bottom pieces
        self.top_rot = top_rot    # in degrees or steps
        self.bot_rot = bot_rot

    def __repr__(self):
        return (f"CubeState(top_face='{self.top_face}', bot_face='{self.bot_face}', "
                f"top_rot={self.top_rot}, bot_rot={self.bot_rot})")
    
    def can_flip(self) -> bool:
        return (
            (self.top_face[0] != self.top_face[11]) and 
            (self.top_face[5] != self.top_face[6]) and
            (self.bot_face[4] != self.bot_face[5]) and 
            (self.top_face[10] != self.top_face[11]) 
        )
    
    def rotate_face(self, top_face, rot):
        if top_face is True:
            self.top_face = self.top_face[-rot] + self.top_face[:-rot]
        else:
            self.bot_face = self.bot_face[-rot] + self.bot_face[:-rot]

    def flip(self):
        if not self.can_flip():
            return
        
        new_top_face = (self.top_face[0:6] + self.bot_face[5:11])
        new_bot_face = (self.bot_face[0:5] + self.top_face[6:12])
        self.top_face = new_top_face
        self.bot_face = new_bot_face

    def to_string(self) -> str:
        return "top: " + decode_face_string(self.top_face, piece_codex) + ", bottom: " + decode_face_string(self.bot_face, piece_codex)

    def to_string_raw(self) -> str:
        return "top: " + self.top_face + ", bottom: " + self.bot_face

def can_flip(faces) -> bool:
    (top, bot) = faces
    return (
        (top[0] != top[11]) and 
        (top[5] != top[6]) and
        (bot[0] != bot[11]) and 
        (bot[5] != bot[6])
    )

def flip_cube(faces):
    (top, bot) = faces
    if not can_flip(faces):
        return faces
    return (
        top[0:6] + bot[6:12], 
        bot[0:6] + top[6:12]
    )

def rotate_faces(faces, top_rot, bot_rot):
    (top, bot) = faces
    return [
        top[-top_rot:] + top[:-top_rot], 
        bot[-bot_rot:] + bot[:-bot_rot]
    ]

def shift_face(s, r):
    return s[-r:] + s[:-r]

def print_cube(faces):
        (top, bot) = faces
        return "top: " + decode_face_string(top, piece_codex) + ", bot: " + decode_face_string(bot, piece_codex)

def print_cube_raw(faces):
        (top, bot) = faces
        return "top: " + top + ", bot: " + bot

solved_cube = CubeState("AAaBBbCCcDDd", "eEEfFFgGGhHH", 0, 0)
current_cube = CubeState("AAaEEbCCcGGd", PWGO[1] + PSYR[1] + PYBR[1] + PSYO[1] + PWBR[1] + PSYB[1] + PYGO[1] + PSYG[1] , 0, 0)


def bfs(start_state, goal_state):
    queue = deque([(start_state, [])])
    visited = set()

    while queue:
        current_state, path = queue.popleft()
        if current_state == goal_state:
            return path

        if current_state in visited:
            continue
        visited.add(current_state)

        # Generate next states using allowed operations
        s1, s2 = current_state
        next_states = []
        for i in range (0, 6):
            for j in range (0, 6):
                next_states.append(((shift_face(s1, i), shift_face(s2, j)), path + ['r' + str(i) + "," + str(j) + ' (' + shift_face(s1, i) + '), (' + shift_face(s2, j) + ')']))
        (flipped_top, flipped_bot) = flip_cube(current_state)
        next_states.append(((flipped_top, flipped_bot), path + ['flip '  + '(' + flipped_top + '), (' + flipped_bot + ')']))
        for state, new_path in next_states:
            if state not in visited:
                queue.append((state, new_path))

    return None

def bidirectional_bfs(start_state, goal_state):
    if start_state == goal_state:
        return []

    forward_queue = deque([(start_state, [])])
    backward_queue = deque([(goal_state, [])])

    forward_visited = {start_state: []}
    backward_visited = {goal_state: []}

    iter = 0
    while forward_queue and backward_queue:
        iter += 1
        print("iter: " + str(iter))
        # Expand forward
        path = expand_layer(forward_queue, forward_visited, backward_visited, direction="forward")
        if path:
            return path

        # Expand backward
        path = expand_layer(backward_queue, backward_visited, forward_visited, direction="backward")
        if path:
            return path

    return None

def expand_layer(queue, visited, other_visited, direction="forward"):
    for _ in range(len(queue)):
        current_state, path = queue.popleft()

        s1, s2 = current_state
        next_states = []
        for i in range (0, 6):
            for j in range (0, 6):
                # next_states.append(((shift_face(s1, i), shift_face(s2, j)), path + ['r' + str(i) + "," + str(j) + ' (' + shift_face(s1, i) + '), (' + shift_face(s2, j) + ')']))
                next_states.append(((shift_face(s1, i), shift_face(s2, j)), path + ['r' + str(i) + "," + str(j)]))
        (flipped_top, flipped_bot) = flip_cube(current_state)
        # next_states.append(((flipped_top, flipped_bot), path + ['flip '  + '(' + flipped_top + '), (' + flipped_bot + ')']))
        next_states.append(((flipped_top, flipped_bot), path + ['flip']))

        for state, new_path in next_states:
            if state in visited:
                continue

            if state in other_visited:
                if direction == "forward":
                    return new_path + other_visited[state][::-1]
                else:
                    return other_visited[state] + new_path[::-1]

            visited[state] = new_path
            queue.append((state, new_path))

    return None

# print("pre:  " + current_cube.to_string())
# print("pre:  " + current_cube.to_string_raw())
# print("can rotate: " + str(current_cube.can_rotate()))
# current_cube.flip()
# print("post: " + current_cube.to_string())
# print("post: " + current_cube.to_string_raw())

curr_top_face = PYRG[1] + PSWO[1] + PWOB[1] + PSWB[1] + PYOB[1] + PSWR[1] + PWRG[1] + PSWG[1]
curr_bot_face = PSYR[1] + PYBR[1] + PSYO[1] + PWBR[1] + PSYB[1] + PYGO[1] + PSYG[1] + PWGO[1]

faces = (curr_top_face, curr_bot_face)

"""
# print("0R: " + "top: " + faces[0] + ", bot: " + faces[1])
print("state 0: " + print_cube(faces))
print("can flip: " + str(can_flip(faces)))
faces = rotate_faces(faces, 0, 1)
print("state 1: " + print_cube(faces))
print("can flip: " + str(can_flip(faces)))
faces = rotate_faces(faces, 0, 2)
# print("1R: " + "top: " + faces[0] + ", bot: " + faces[1])
print("state 2: " + print_cube(faces))
print("can flip: " + str(can_flip(faces)))
faces = flip_cube(faces)
# print("2R: " + "top: " + faces[0] + ", bot: " + faces[1])
print("state 3: " + print_cube(faces))
print("can flip: " + str(can_flip(faces)))

"""

start = (
    PWOB[1] + PSWB[1] + PWBR[1] + PSWR[1] + PWRG[1] + PSWG[1] + PWGO[1] + PSWO[1],
    PSYB[1] + PYBR[1] + PSYR[1] + PYRG[1] + PSYG[1] + PYGO[1] + PSYO[1] + PYOB[1]
)

start = (
    "AAaBBbCCcDDd", "fGGhEEgHHeFF"
)

start = (
    face_from_meaning("WGO,YBR,YR,WO,WOB,YB,WB,YG,WG", piece_decodex),
    face_from_meaning("YRG,YOB,YO,WR,WRG,WBR,YGO", piece_decodex)
)

(sa, sb) = start
print("sa: " + sa)
print("sb: " + sb)

goal = ("AAaBBbCCcDDd", "eEEfFFgGGhHH")

scram_state = ("AAaBBbCCcDDd", "eEEfFFgGGhHH")

flip_count = 0
while flip_count < 100:
    scram_state = rotate_faces(scram_state, random.randint(0, 12), random.randint(0, 12))
    if can_flip(scram_state):
        scram_state = flip_cube(scram_state)
        flip_count += 1

print("scram: " + print_cube(scram_state))

print("state 0: " + print_cube(start))
print("top rotate 1: " + print_cube_raw(rotate_faces(start, 1, 0)))
print("bot rotate 1: " + print_cube_raw(rotate_faces(start, 0, 1)))

print("Starting bfs...")
solution = bidirectional_bfs(start, goal)
print("Solution:")

(s_top, s_bot) = start

def apply_move(state, move: str):
    if move[0] == 'r':
        (rtop, rbot) = move[1:].split(',')
        print('rotated ' + rtop + ',' + rbot)
        return rotate_faces(state, int(rtop), int(rbot))
    else:
        print('flipped')
        return flip_cube(state)

current_state = start
if solution is None:
    print("No solution found")
else:
    print("curr (" + s_top + "), (" + s_bot + ")")
    for move in solution:
        current_state = apply_move(current_state, move)
        print(move + "  :  " + print_cube(current_state))




# Initialize Pygame
pygame.init()

# Set up the display
width, height = 800, 600
screen = pygame.display.set_mode((width, height))
pygame.display.set_caption("Polygon Example")

# Define the points of the polygon
polygon_points = [(100, 100), (200, 80), (300, 150), (250, 250), (150, 200)]

# Define colors
WHITE = (255, 255, 255)
BLUE = (0, 0, 255)

# Main loop
running = True
while running:
    screen.fill(WHITE)  # Clear screen with white

    # Draw the polygon
    pygame.draw.polygon(screen, BLUE, polygon_points)

    # Event handling
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    pygame.display.flip()  # Update the display

# Quit Pygame
pygame.quit()
sys.exit()
