# Deprecated & Incorrect Fusion 360 API Patterns

This file lists patterns that Claude's training data commonly gets wrong.
Check this list before writing any Fusion 360 code.

## 1. Wrong: Direct Feature Construction

Claude often generates code that tries to create features by directly calling constructors
or factory methods that don't exist.

```python
# WRONG — ExtrudeFeature has no constructor
ext = adsk.fusion.ExtrudeFeature(profile, distance)

# CORRECT — Use the Input → Add pattern
extrudes = rootComp.features.extrudeFeatures
extInput = extrudes.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(2.0))
ext = extrudes.add(extInput)
```

## 2. Wrong: Old-Style Event Handlers

Claude often generates the old verbose event handler pattern instead of using the
modern `fusion360utils.add_handler` pattern.

```python
# WRONG — Old pattern (still works but verbose and error-prone)
class MyCommandCreatedHandler(adsk.core.CommandCreatedEventHandler):
    def __init__(self):
        super().__init__()
    def notify(self, args):
        # ...
        pass
handler = MyCommandCreatedHandler()
cmd_def.commandCreated.add(handler)
_handlers.append(handler)  # Must keep reference or it gets garbage collected

# CORRECT — Modern template pattern
from .lib import fusion360utils as futil
futil.add_handler(cmd_def.commandCreated, command_created)
```

Note: The old pattern IS still valid Python and works. But the modern pattern is simpler
and less error-prone (no need to manually keep handler references).

## 3. Wrong: Accessing Design Without Casting

```python
# WRONG — activeProduct returns Product, not Design
design = app.activeProduct
rootComp = design.rootComponent  # May fail

# CORRECT — Cast to Design
design = adsk.fusion.Design.cast(app.activeProduct)
if not design:
    ui.messageBox('No active Fusion design')
    return
rootComp = design.rootComponent
```

## 4. Wrong: Sketch Curve Access

```python
# WRONG — No direct .lines or .circles on Sketch
lines = sketch.lines
circles = sketch.circles

# CORRECT — Go through sketchCurves
lines = sketch.sketchCurves.sketchLines
circles = sketch.sketchCurves.sketchCircles
arcs = sketch.sketchCurves.sketchArcs
```

## 5. Wrong: Creating Points Incorrectly

```python
# WRONG — Point3D has no constructor
pt = adsk.core.Point3D(1, 2, 3)

# WRONG — Wrong method name
pt = adsk.core.Point3D.new(1, 2, 3)

# CORRECT — Use the static create method
pt = adsk.core.Point3D.create(1, 2, 3)
```

This applies to all transient geometry objects:

```python
adsk.core.Point3D.create(x, y, z)
adsk.core.Vector3D.create(x, y, z)
adsk.core.Matrix3D.create()
adsk.core.ObjectCollection.create()
adsk.core.ValueInput.createByReal(value)
adsk.core.ValueInput.createByString(expression)
```

## 6. Wrong: Assuming Millimeters

```python
# WRONG — This creates a 5 cm circle, not 5 mm
circle = circles.addByCenterRadius(center, 5)

# CORRECT — Fusion internal units are CENTIMETERS
circle = circles.addByCenterRadius(center, 0.5)  # 0.5 cm = 5 mm

# CORRECT — Or use ValueInput with string units
distance = adsk.core.ValueInput.createByString('5 mm')
```

## 7. Wrong: Assuming Degrees for Angles

```python
# WRONG — This is 90 radians, not 90 degrees!
revInput.setAngleExtent(False, adsk.core.ValueInput.createByReal(90))

# CORRECT — Use math.radians() or math.pi
revInput.setAngleExtent(False, adsk.core.ValueInput.createByReal(math.radians(90)))

# CORRECT — Or use string expression
revInput.setAngleExtent(False, adsk.core.ValueInput.createByString('90 deg'))
```

## 8. Wrong: Missing Error Handling

```python
# WRONG — Bare except with no logging
def run(context):
    try:
        pass
    except:
        pass  # Silently swallows errors

# CORRECT — Log the traceback
def run(context):
    try:
        pass
    except:
        app.log(f'Failed:\n{traceback.format_exc()}')
```

## 9. Wrong: Not Cleaning Up UI in stop()

```python
# WRONG — Add-in that adds buttons but never removes them
def stop(context):
    pass

# CORRECT — Remove all UI elements you added
def stop(context):
    try:
        workspace = ui.workspaces.itemById(WORKSPACE_ID)
        panel = workspace.toolbarPanels.itemById(PANEL_ID)
        control = panel.controls.itemById(CMD_ID)
        cmd_def = ui.commandDefinitions.itemById(CMD_ID)
        if control:
            control.deleteMe()
        if cmd_def:
            cmd_def.deleteMe()
    except:
        futil.handle_error('stop')
```

## 10. Wrong: Hallucinated Method Names

Claude frequently invents methods that sound right but don't exist. Common examples:

| Hallucinated                    | Correct                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| `sketch.addLine(...)`           | `sketch.sketchCurves.sketchLines.addByTwoPoints(...)`             |
| `sketch.addCircle(...)`         | `sketch.sketchCurves.sketchCircles.addByCenterRadius(...)`        |
| `sketch.drawRectangle(...)`     | `sketch.sketchCurves.sketchLines.addTwoPointRectangle(...)`       |
| `component.addExtrude(...)`     | `component.features.extrudeFeatures.createInput(...) + .add(...)` |
| `design.parameters.get('name')` | `design.userParameters.itemByName('name')`                        |
| `body.exportSTL(path)`          | `design.exportManager.createSTLExportOptions(body, path)`         |
| `sketch.createProfile()`        | Profiles are auto-created: `sketch.profiles.item(0)`              |
| `app.activeDesign`              | `adsk.fusion.Design.cast(app.activeProduct)`                      |
| `Point3D(x, y, z)`              | `adsk.core.Point3D.create(x, y, z)`                               |

**If you're about to use a method and you're not 100% sure it exists, search the docs first.**

## 11. Wrong: Forgetting Manifest Type for Add-ins

```json
// WRONG — Using "script" type for an add-in
{ "type": "script" }

// CORRECT — Add-ins must use "addin"
{ "type": "addin" }
```

## 12. Wrong: Incorrect Import Style

```python
# WRONG — Can't import specific objects directly
from adsk.core import Point3D, Application

# CORRECT — Import the module, use fully qualified names
import adsk.core
pt = adsk.core.Point3D.create(0, 0, 0)
```

Fusion's Python environment has limitations on how the adsk packages can be imported.
Always use `import adsk.core` and `import adsk.fusion`, then use the full path.

## 13. Wrong: Using distanceOne to Limit a Cut Sweep

```python
# WRONG — distanceOne has no effect on Cut sweeps (verified by diagnostic)
si = sweeps.createInput(prof, path, adsk.fusion.FeatureOperations.CutFeatureOperation)
si.distanceOne = adsk.core.ValueInput.createByReal(0.9)  # This is silently ignored

# CORRECT — Full sweep Cut, then fill-back with extrude-Join at each end
sweep = sweeps.add(si)  # d1 ignored, cuts full path
# Create plane at 90% of path, extrude-Join toward end to fill the groove
fill_plane = _make_profile_plane(root, path, 0.9)
ext_input = extrudes.createInput(prof, adsk.fusion.FeatureOperations.JoinFeatureOperation)
dist = adsk.fusion.DistanceExtentDefinition.create(adsk.core.ValueInput.createByReal(gap_cm))
ext_input.setOneSideExtent(dist, adsk.fusion.ExtentDirections.PositiveExtentDirection)
ext_input.participantBodies = [body]
extrudes.add(ext_input)
```

## 14. Wrong: AllExtentDefinition.create()

```python
# WRONG — AllExtentDefinition has no create() method
all_ext = adsk.fusion.AllExtentDefinition.create()

# CORRECT — For one-sided through-all extrude:
through_all = adsk.fusion.ThroughAllExtentDefinition.create()
ext_input.setOneSideExtent(through_all, adsk.fusion.ExtentDirections.PositiveExtentDirection)

# CORRECT — For both-sides through-all extrude:
ext_input.setAllExtent(adsk.fusion.ExtentDirections.SymmetricExtentDirection)
```

## 15. Wrong: ObjectCollection for SWIG list Parameters

```python
# WRONG — SWIG expects plain Python list, not ObjectCollection
col = adsk.core.ObjectCollection.create()
col.add(body)
ext_input.participantBodies = col  # TypeError

# CORRECT — Plain Python list
ext_input.participantBodies = [body]
```

Check the Python stub type hint. If it says `list[Something]`, use a plain list.

## 16. Wrong: CurveEvaluator3D.parametricRange()

```python
# WRONG — This method only exists on SurfaceEvaluator
pr = ev.parametricRange()

# CORRECT — Returns (bool, startParam, endParam)
ok, start, end = ev.getParameterExtents()
```

## The Golden Rule

When in doubt: **write a diagnostic script** that creates test geometry, performs the operation,
and measures the result with bounding boxes and point containment. Numbers don't lie.

If you must check docs: `https://help.autodesk.com/cloudhelp/ENU/Fusion-360-API/files/<ObjectName>.htm`
