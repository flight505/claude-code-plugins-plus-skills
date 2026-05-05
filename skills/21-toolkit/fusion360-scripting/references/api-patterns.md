# Fusion 360 API Patterns Reference

## Table of Contents

1. [Script Boilerplate](#script-boilerplate)
2. [Add-in Boilerplate](#add-in-boilerplate)
3. [Sketch Operations](#sketch-operations)
4. [Feature Operations](#feature-operations)
5. [Command Creation (Custom UI)](#command-creation)
6. [Command Inputs (Dialog Fields)](#command-inputs)
7. [Working with Parameters](#parameters)
8. [Working with Bodies](#bodies)
9. [Construction Geometry](#construction-geometry)
10. [Export Operations](#export-operations)
11. [Useful Transient Objects](#transient-objects)

---

## 1. Script Boilerplate <a name="script-boilerplate"></a>

```python
"""Description of what this script does."""

import traceback
import math
import adsk.core
import adsk.fusion

app = adsk.core.Application.get()
ui = app.userInterface


def run(context: str):
    try:
        design = adsk.fusion.Design.cast(app.activeProduct)
        if not design:
            ui.messageBox('A Fusion design must be active.')
            return

        rootComp = design.rootComponent

        # --- Your code here ---

    except:
        app.log(f'Failed:\n{traceback.format_exc()}')
```

## 2. Add-in Boilerplate <a name="add-in-boilerplate"></a>

### Main entry point (MyAddIn.py)

```python
from . import commands
from .lib import fusion360utils as futil


def run(context):
    try:
        commands.start()
    except:
        futil.handle_error('run')


def stop(context):
    try:
        futil.clear_handlers()
        commands.stop()
    except:
        futil.handle_error('stop')
```

### commands/**init**.py

```python
# Import each command module here. Each module must have start() and stop().
from .commandDialog import entry as commandDialog

commands = [commandDialog]


def start():
    for command in commands:
        command.start()


def stop():
    for command in commands:
        command.stop()
```

### Command entry.py (commands/myCommand/entry.py)

This is the verified modern pattern for creating a command with a dialog:

````python
import adsk.core
import adsk.fusion
import os
from ...lib import fusion360utils as futil

app = adsk.core.Application.get()
ui = app.userInterface

# Command identity — change these for your command
CMD_ID = f'MyUniqueCommandId'
CMD_NAME = 'My Command Name'
CMD_Description = 'Description shown in tooltip'

# Where to place the button in the UI
WORKSPACE_ID = 'FusionSolidEnvironment'
PANEL_ID = 'SolidScriptsAddinsPanel'
COMMAND_BESIDE_ID = 'ScriptsManagerCommand'
IS_PROMOTED = True  # Show in toolbar, not just panel

# Resource directory for icons (16x16, 32x32, 64x64 PNGs)
ICON_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'resources', '')

# Track local handlers for cleanup
local_handlers = []


def start():
    """Create the command definition and add button to UI."""
    cmd_def = ui.commandDefinitions.addButtonDefinition(
        CMD_ID, CMD_NAME, CMD_Description, ICON_FOLDER
    )

    # Connect to commandCreated event
    futil.add_handler(cmd_def.commandCreated, command_created)

    # Add button to the UI
    workspace = ui.workspaces.itemById(WORKSPACE_ID)
    panel = workspace.toolbarPanels.itemById(PANEL_ID)

    control = panel.controls.addCommand(cmd_def, COMMAND_BESIDE_ID, False)
    control.isPromoted = IS_PROMOTED


def stop():
    """Remove UI elements on shutdown."""
    workspace = ui.workspaces.itemById(WORKSPACE_ID)
    panel = workspace.toolbarPanels.itemById(PANEL_ID)

    command_control = panel.controls.itemById(CMD_ID)
    command_definition = ui.commandDefinitions.itemById(CMD_ID)

    if command_control:
        command_control.deleteMe()
    if command_definition:
        command_definition.deleteMe()


## Polish: Icons, Toolclip, Tooltips, Help

For add-ins, always include these — they make the command feel native:

```python
# Icons: 16x16.png, 32x32.png, 64x64.png in a Resources/ folder
cmd_def = ui.commandDefinitions.addButtonDefinition(CMD_ID, CMD_NAME, CMD_DESC, ICON_FOLDER)

# Toolclip: 300x200px PNG shown on progressive hover (standard Fusion size)
cmd_def.toolClipFilename = os.path.join(ICON_FOLDER, 'toolclip.png')

# Help file: shows (i) icon in the command dialog header
cmd.helpFile = os.path.join(ICON_FOLDER, 'help.html')

# Tooltips on each command input (set after creating the input):
my_input.tooltip = 'Short label'
my_input.tooltipDescription = 'Longer HTML description with <b>bold</b> and <br> line breaks.'
````

def command_created(args: adsk.core.CommandCreatedEventArgs):
"""Called when the command is created. Set up dialog inputs here.""" # Get the CommandInputs collection to add dialog controls
inputs = args.command.commandInputs

    # Example: add a value input for distance (default 1 cm)
    defaultLengthUnits = app.activeProduct.unitsManager.defaultLengthUnits
    default_value = adsk.core.ValueInput.createByString('1')
    inputs.addValueInput('distanceInput', 'Distance', defaultLengthUnits, default_value)

    # Example: add a selection input
    selInput = inputs.addSelectionInput('bodySelect', 'Select Body', 'Select a body')
    selInput.addSelectionFilter('Bodies')
    selInput.setSelectionLimits(1, 1)

    # Connect to execute and other events
    futil.add_handler(
        args.command.execute, command_execute, local_handlers=local_handlers
    )
    futil.add_handler(
        args.command.inputChanged, command_input_changed, local_handlers=local_handlers
    )
    futil.add_handler(
        args.command.validateInputs, command_validate_input, local_handlers=local_handlers
    )
    futil.add_handler(
        args.command.destroy, command_destroy, local_handlers=local_handlers
    )

def command_execute(args: adsk.core.CommandEventArgs):
"""Called when user clicks OK. Do the actual work here."""
inputs = args.command.commandInputs

    # Read input values
    distanceInput: adsk.core.ValueCommandInput = inputs.itemById('distanceInput')
    distance_value = distanceInput.value  # In internal units (cm)

    # --- Your logic here ---
    futil.log(f'Command executed with distance: {distance_value}')

def command_input_changed(args: adsk.core.InputChangedEventArgs):
"""Called when any input value changes. Use to update other inputs dynamically."""
changed_input = args.input
inputs = args.inputs

def command_validate_input(args: adsk.core.ValidateInputsEventArgs):
"""Called to validate inputs. Set args.areInputsValid = False to disable OK."""
args.areInputsValid = True

def command_destroy(args: adsk.core.CommandEventArgs):
"""Called when the command is destroyed. Clean up local handlers."""
global local_handlers
local_handlers = []

````

### The fusion360utils Library

The template includes `lib/fusion360utils/` which provides:
- `add_handler(event, callback, local_handlers=None)` — simplified event subscription
- `handle_error(name)` — logs errors to the text commands window
- `log(msg)` — logs to the text commands window
- `clear_handlers()` — removes all registered event handlers

You do NOT need to write this library — it's generated by Fusion when you create an add-in.
If creating files outside of Fusion, just know the imports expect this structure.

---

## 3. Sketch Operations <a name="sketch-operations"></a>

### Creating a Sketch
```python
sketches = rootComp.sketches

# On a construction plane
sketch = sketches.add(rootComp.xYConstructionPlane)
# Also: xZConstructionPlane, yZConstructionPlane

# On a planar face
face = body.faces.item(0)  # Must be planar
sketch = sketches.add(face)
````

### Drawing Geometry

All sketch curve collections are under `sketch.sketchCurves`:

```python
lines = sketch.sketchCurves.sketchLines
circles = sketch.sketchCurves.sketchCircles
arcs = sketch.sketchCurves.sketchArcs
ellipses = sketch.sketchCurves.sketchEllipses
splines = sketch.sketchCurves.sketchFittedSplines

# Lines
line = lines.addByTwoPoints(
    adsk.core.Point3D.create(0, 0, 0),
    adsk.core.Point3D.create(5, 0, 0)
)

# Rectangle (returns SketchLineList with 4 lines)
rect = lines.addTwoPointRectangle(
    adsk.core.Point3D.create(0, 0, 0),
    adsk.core.Point3D.create(4, 3, 0)
)

# Center-point rectangle
rect = lines.addCenterPointRectangle(
    adsk.core.Point3D.create(2, 1.5, 0),   # center
    adsk.core.Point3D.create(4, 3, 0)       # corner
)

# Circle
circle = circles.addByCenterRadius(
    adsk.core.Point3D.create(0, 0, 0), 2.0  # radius in cm
)

# Arc by center, start point, and sweep angle
arc = arcs.addByCenterStartSweep(
    adsk.core.Point3D.create(0, 0, 0),   # center
    adsk.core.Point3D.create(2, 0, 0),   # start
    math.radians(90)                      # sweep angle in radians
)

# Arc by three points
arc = arcs.addByThreePoints(
    adsk.core.Point3D.create(0, 0, 0),
    adsk.core.Point3D.create(1, 1, 0),
    adsk.core.Point3D.create(2, 0, 0)
)

# Fillet between two lines
arc = arcs.addFillet(line1, line1.endSketchPoint.geometry,
                     line2, line2.startSketchPoint.geometry, 0.5)
```

### Sketch Dimensions

```python
dims = sketch.sketchDimensions

# Dimension a line's length
dim = dims.addDistanceDimension(
    line.startSketchPoint, line.endSketchPoint,
    adsk.fusion.DimensionOrientations.AlignedDimensionOrientation,
    adsk.core.Point3D.create(2.5, 1, 0)  # text position
)
```

### Sketch Points

```python
points = sketch.sketchPoints
pt = points.add(adsk.core.Point3D.create(1, 2, 0))
```

### Profiles

After creating closed geometry, Fusion auto-detects profiles:

```python
# profiles.count gives number of closed regions
prof = sketch.profiles.item(0)

# If multiple profiles, iterate to find the right one
for i in range(sketch.profiles.count):
    p = sketch.profiles.item(i)
    # Check p.boundingBox or p.areaProperties() to identify
```

---

## 4. Feature Operations <a name="feature-operations"></a>

### FeatureOperations enum

```python
adsk.fusion.FeatureOperations.NewBodyFeatureOperation    # Create new body
adsk.fusion.FeatureOperations.JoinFeatureOperation       # Add to existing body
adsk.fusion.FeatureOperations.CutFeatureOperation        # Cut from existing body
adsk.fusion.FeatureOperations.IntersectFeatureOperation   # Intersect with body
adsk.fusion.FeatureOperations.NewComponentFeatureOperation # Create in new component
```

### Extrude

```python
extrudes = rootComp.features.extrudeFeatures
extInput = extrudes.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)

# One-direction distance
distance = adsk.core.ValueInput.createByReal(2.0)  # cm
extInput.setDistanceExtent(False, distance)

# Symmetric extent
extInput.setSymmetricExtent(adsk.core.ValueInput.createByReal(1.0), True)

# Two-side extent
extInput.setTwoSidesExtent(
    adsk.fusion.DistanceExtentDefinition.create(adsk.core.ValueInput.createByReal(2.0)),
    adsk.fusion.DistanceExtentDefinition.create(adsk.core.ValueInput.createByReal(1.0))
)

# To-object extent
extInput.setOneSideToExtent(toEntity, False)

# All extent (through all)
extInput.setAllExtent(adsk.fusion.ExtentDirections.PositiveExtentDirection)

ext = extrudes.add(extInput)
```

### Revolve

```python
revolves = rootComp.features.revolveFeatures
revInput = revolves.createInput(
    prof, axisLine,  # axisLine is a SketchLine or ConstructionAxis
    adsk.fusion.FeatureOperations.NewBodyFeatureOperation
)
angle = adsk.core.ValueInput.createByReal(math.pi * 2)
revInput.setAngleExtent(False, angle)
rev = revolves.add(revInput)
```

### Fillet

```python
fillets = rootComp.features.filletFeatures
filletInput = fillets.createInput()
edges = adsk.core.ObjectCollection.create()
edges.add(someEdge)
filletInput.addConstantRadiusEdgeSet(edges, adsk.core.ValueInput.createByReal(0.2), True)
fillet = fillets.add(filletInput)
```

### Chamfer

```python
chamfers = rootComp.features.chamferFeatures
edges = adsk.core.ObjectCollection.create()
edges.add(someEdge)
chamferInput = chamfers.createInput2()
chamferInput.chamferEdgeSets.addEqualDistanceChamferEdgeSet(
    edges, adsk.core.ValueInput.createByReal(0.1), True
)
chamfer = chamfers.add(chamferInput)
```

### Shell

```python
shells = rootComp.features.shellFeatures
faces = adsk.core.ObjectCollection.create()
faces.add(topFace)
shellInput = shells.createInput(faces, False)
shellInput.insideThickness = adsk.core.ValueInput.createByReal(0.2)
shell = shells.add(shellInput)
```

### Combine

```python
combines = rootComp.features.combineFeatures
combineInput = combines.createInput(targetBody, toolBodies)
combineInput.operation = adsk.fusion.FeatureOperations.JoinFeatureOperation
combine = combines.add(combineInput)
```

### Pattern (Rectangular)

```python
patterns = rootComp.features.rectangularPatternFeatures
entities = adsk.core.ObjectCollection.create()
entities.add(someFeature)
patternInput = patterns.createInput(
    entities,
    rootComp.xConstructionAxis,  # direction 1
    adsk.core.ValueInput.createByReal(3),   # count
    adsk.core.ValueInput.createByReal(2.0), # spacing (cm)
    adsk.fusion.PatternDistanceType.SpacingPatternDistanceType
)
pattern = patterns.add(patternInput)
```

### Mirror

```python
mirrors = rootComp.features.mirrorFeatures
entities = adsk.core.ObjectCollection.create()
entities.add(someBody)
mirrorInput = mirrors.createInput(entities, rootComp.xYConstructionPlane)
mirror = mirrors.add(mirrorInput)
```

---

## 5. Command Creation <a name="command-creation"></a>

See the full command pattern in the "Add-in Boilerplate" section above. Key points:

### Common Workspace and Panel IDs

```python
# Design workspace
WORKSPACE_ID = 'FusionSolidEnvironment'

# Common panel IDs in Design workspace:
'SolidScriptsAddinsPanel'    # ADD-INS panel
'SolidCreatePanel'           # CREATE panel in SOLID tab
'SolidModifyPanel'           # MODIFY panel in SOLID tab
'InspectPanel'               # INSPECT panel

# To discover available panels programmatically:
workspace = ui.workspaces.itemById('FusionSolidEnvironment')
for i in range(workspace.toolbarPanels.count):
    panel = workspace.toolbarPanels.item(i)
    app.log(f'Panel: {panel.id} - {panel.name}')
```

### Icons

Place PNG files in the command's `resources/` directory:

- `16x16.png` (required)
- `32x32.png` (recommended)
- `64x64.png` (optional, for high DPI)

---

## 6. Command Inputs <a name="command-inputs"></a>

Command inputs are the dialog fields. All are added via `args.command.commandInputs`:

```python
inputs = args.command.commandInputs

# Value input (number with units)
inputs.addValueInput('height', 'Height', 'mm', adsk.core.ValueInput.createByString('10'))

# Integer input (slider)
inputs.addIntegerSliderCommandInput('count', 'Count', 1, 20, False)

# Boolean (checkbox)
inputs.addBoolValueInput('symmetric', 'Symmetric', True, '', True)

# String input
inputs.addStringValueInput('name', 'Name', 'Default Name')

# Selection input
sel = inputs.addSelectionInput('face', 'Select Face', 'Select a face')
sel.addSelectionFilter('Faces')
sel.setSelectionLimits(1, 1)  # min, max selections

# Dropdown
dropdown = inputs.addDropDownCommandInput('style', 'Style',
    adsk.core.DropDownStyles.TextListDropDownStyle)
dropdown.listItems.add('Option A', True, '')
dropdown.listItems.add('Option B', False, '')

# Group (collapsible section)
group = inputs.addGroupCommandInput('advanced', 'Advanced Options')
group.isExpanded = False
group.children.addBoolValueInput('preview', 'Show Preview', True, '', False)
```

### Common Selection Filters

```python
'Faces'              # BRep faces
'Bodies'             # Solid or surface bodies
'Edges'              # BRep edges
'Vertices'           # BRep vertices
'SketchCurves'       # Sketch curves
'SketchPoints'       # Sketch points
'Profiles'           # Sketch profiles
'PlanarFaces'        # Only planar faces
'CylindricalFaces'   # Only cylindrical faces
'ConstructionPlanes' # Construction planes
'Occurrences'        # Component occurrences
```

---

## 7. Working with Parameters <a name="parameters"></a>

```python
design = adsk.fusion.Design.cast(app.activeProduct)

# All parameters (user + model)
allParams = design.allParameters

# User parameters only
userParams = design.userParameters

# Get by name
param = userParams.itemByName('width')
if param:
    current_value = param.value        # In internal units (cm)
    current_expr = param.expression    # e.g., '25 mm'
    param.expression = '30 mm'         # Modify

# Add a new user parameter
userParams.add('myParam', adsk.core.ValueInput.createByString('10 mm'), 'mm', 'My custom parameter')
```

---

## 8. Working with Bodies <a name="bodies"></a>

```python
# All bodies in root component
bodies = rootComp.bRepBodies
for i in range(bodies.count):
    body = bodies.item(i)
    app.log(f'Body: {body.name}, Volume: {body.volume} cm³')

# Access faces, edges, vertices of a body
for i in range(body.faces.count):
    face = body.faces.item(i)

for i in range(body.edges.count):
    edge = body.edges.item(i)

# Physical properties
physProps = body.physicalProperties
volume = physProps.volume        # cm³
area = physProps.area            # cm²
mass = physProps.mass            # kg (if material assigned)
centerOfMass = physProps.centerOfMass  # Point3D
```

---

## 9. Construction Geometry <a name="construction-geometry"></a>

```python
# Built-in construction planes
rootComp.xYConstructionPlane
rootComp.xZConstructionPlane
rootComp.yZConstructionPlane

# Built-in construction axes
rootComp.xConstructionAxis
rootComp.yConstructionAxis
rootComp.zConstructionAxis

# Built-in origin point
rootComp.originConstructionPoint

# Create offset construction plane
planes = rootComp.constructionPlanes
planeInput = planes.createInput()
offset = adsk.core.ValueInput.createByReal(5.0)  # 5 cm offset
planeInput.setByOffset(rootComp.xYConstructionPlane, offset)
plane = planes.add(planeInput)
```

---

## 10. Export Operations <a name="export-operations"></a>

```python
# STL export
exportMgr = design.exportManager
stlOptions = exportMgr.createSTLExportOptions(body, '/path/to/output.stl')
stlOptions.meshRefinement = adsk.fusion.MeshRefinementSettings.MeshRefinementMedium
exportMgr.execute(stlOptions)

# STEP export
stepOptions = exportMgr.createSTEPExportOptions('/path/to/output.step', rootComp)
exportMgr.execute(stepOptions)

# IGES export
igesOptions = exportMgr.createIGESExportOptions('/path/to/output.igs', rootComp)
exportMgr.execute(igesOptions)
```

**IMPORTANT**: Always verify export method signatures by searching the docs. Export APIs
have changed across Fusion versions.

---

## 11. Useful Transient Objects <a name="transient-objects"></a>

These are created statically (no parent object needed):

```python
# Point3D — always in cm
pt = adsk.core.Point3D.create(x, y, z)

# Vector3D
vec = adsk.core.Vector3D.create(1, 0, 0)

# ValueInput — for parameterized values
val = adsk.core.ValueInput.createByReal(2.5)        # 2.5 cm
val = adsk.core.ValueInput.createByString('25 mm')   # string with units

# ObjectCollection — for passing groups of objects
coll = adsk.core.ObjectCollection.create()
coll.add(obj1)
coll.add(obj2)

# Matrix3D — for transforms
matrix = adsk.core.Matrix3D.create()
matrix.translation = adsk.core.Vector3D.create(5, 0, 0)
```
