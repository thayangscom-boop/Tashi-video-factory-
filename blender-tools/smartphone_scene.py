
import bpy
import math

# Tashi Video Factory
# First Blender smartphone studio scene

# Clear existing scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Materials
def make_material(name, color, metallic=0.0, roughness=0.4):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    return mat

titanium = make_material(
    "Premium Titanium",
    (0.24, 0.27, 0.32), 0.85, 0.22
)

screen_mat = make_material(
    "Black Glass Screen",
    (0.008, 0.012, 0.025), 0.35, 0.12
)

gold = make_material(
    "Gold Camera Rings",
    (0.65, 0.38, 0.12), 0.8, 0.2
)

floor_mat = make_material(
    "Dark Studio Floor",
    (0.012, 0.014, 0.02), 0.15, 0.35
)

# Smartphone body
bpy.ops.mesh.primitive_cube_add(
    size=1, location=(0, 0, 0)
)
phone = bpy.context.object
phone.name = "Tashi Premium Smartphone"
phone.dimensions = (2.8, 0.18, 5.8)
bpy.ops.object.transform_apply(
    location=False, rotation=False, scale=True
)
phone.data.materials.append(titanium)

bevel = phone.modifiers.new("Rounded Titanium Edges", "BEVEL")
bevel.width = 0.12
bevel.segments = 8

phone.modifiers.new("Weighted Corner Normals", "WEIGHTED_NORMAL")

# Front glass screen
bpy.ops.mesh.primitive_cube_add(
    size=1, location=(0, -0.101, 0)
)
screen = bpy.context.object
screen.name = "Front Glass Display"
screen.dimensions = (2.58, 0.025, 5.52)
bpy.ops.object.transform_apply(
    location=False, rotation=False, scale=True
)
screen.data.materials.append(screen_mat)

bevel = screen.modifiers.new("Glass Edges", "BEVEL")
bevel.width = 0.08
bevel.segments = 6

# Camera lenses
for x, z in [(-0.75, 2.35), (-0.15, 2.35), (-0.75, 1.75)]:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=48, radius=0.22, depth=0.035,
        location=(x, -0.115, z)
    )
    lens = bpy.context.object
    lens.name = "Camera Lens"
    lens.data.materials.append(gold)

# Studio floor
bpy.ops.mesh.primitive_plane_add(
    size=200, location=(0, 0, -3.1)
)
floor = bpy.context.object
floor.name = "Studio Floor"
floor.data.materials.append(floor_mat)

# Camera
bpy.ops.object.camera_add(location=(8, -11, 7))
camera = bpy.context.object
direction = -camera.location
camera.rotation_euler = direction.to_track_quat(
    '-Z', 'Y'
).to_euler()
camera.data.lens = 55
bpy.context.scene.camera = camera

# Studio lights
def add_area_light(name, location, power, size, color):
    bpy.ops.object.light_add(
        type='AREA', location=location
    )
    light = bpy.context.object
    light.name = name
    light.data.energy = power
    light.data.shape = 'DISK'
    light.data.size = size
    light.data.color = color
    direction = -light.location
    light.rotation_euler = direction.to_track_quat(
        '-Z', 'Y'
    ).to_euler()

add_area_light(
    "Warm Key Light", (1, -6, 7),
    1100, 6, (1.0, 0.72, 0.43)
)

add_area_light(
    "Cool Fill Light", (-6, -3, 2),
    850, 5, (0.45, 0.65, 1.0)
)

add_area_light(
    "Golden Rim Light", (3, 4, 5),
    1500, 4, (1.0, 0.55, 0.2)
)

# Animation
phone.rotation_mode = 'XYZ'
phone.rotation_euler[2] = 0
phone.keyframe_insert(
    data_path="rotation_euler", frame=1
)

phone.rotation_euler[2] = math.radians(12)
phone.keyframe_insert(
    data_path="rotation_euler", frame=90
)

# Render settings
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.render.resolution_x = 1080
scene.render.resolution_y = 1920
scene.render.resolution_percentage = 50
scene.render.image_settings.file_format = 'PNG'
scene.frame_end = 90
scene.render.fps = 30

# Dark world
scene.world.color = (0.025, 0.025, 0.025)

# Select smartphone
bpy.ops.object.select_all(action='DESELECT')
phone.select_set(True)
bpy.context.view_layer.objects.active = phone

print("TASHI VIDEO FACTORY: Smartphone scene created!")
