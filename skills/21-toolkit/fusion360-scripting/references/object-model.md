# Fusion 360 API Object Model Quick Reference

## Core Hierarchy

```
Application (adsk.core.Application.get())
├── activeProduct → Design (adsk.fusion.Design)
│   ├── rootComponent → Component
│   ├── allParameters → ParameterList
│   ├── userParameters → UserParameters
│   ├── exportManager → ExportManager
│   ├── designType → DesignTypes (Parametric or Direct)
│   └── unitsManager → UnitsManager
│
├── activeDocument → Document
│   └── dataFile → DataFile
│
├── userInterface → UserInterface
│   ├── commandDefinitions → CommandDefinitions
│   ├── workspaces → Workspaces
│   ├── toolbars → Toolbars
│   └── palettes → Palettes
│
└── documents → Documents
```

## Component Hierarchy

```
Component
├── sketches → Sketches
│   └── Sketch
│       ├── sketchCurves → SketchCurves
│       │   ├── sketchLines → SketchLines → SketchLine
│       │   ├── sketchCircles → SketchCircles → SketchCircle
│       │   ├── sketchArcs → SketchArcs → SketchArc
│       │   ├── sketchEllipses → SketchEllipses → SketchEllipse
│       │   └── sketchFittedSplines → SketchFittedSplines → SketchFittedSpline
│       ├── sketchPoints → SketchPoints → SketchPoint
│       ├── sketchDimensions → SketchDimensions → SketchDimension
│       ├── profiles → Profiles → Profile
│       └── referencePlane → ConstructionPlane (the plane the sketch is on)
│
├── features → Features
│   ├── extrudeFeatures → ExtrudeFeatures → ExtrudeFeature
│   ├── revolveFeatures → RevolveFeatures → RevolveFeature
│   ├── filletFeatures → FilletFeatures → FilletFeature
│   ├── chamferFeatures → ChamferFeatures → ChamferFeature
│   ├── shellFeatures → ShellFeatures → ShellFeature
│   ├── combineFeatures → CombineFeatures → CombineFeature
│   ├── rectangularPatternFeatures → RectangularPatternFeatures
│   ├── circularPatternFeatures → CircularPatternFeatures
│   ├── mirrorFeatures → MirrorFeatures → MirrorFeature
│   ├── loftFeatures → LoftFeatures → LoftFeature
│   ├── sweepFeatures → SweepFeatures → SweepFeature
│   ├── holeFeatures → HoleFeatures → HoleFeature
│   ├── threadFeatures → ThreadFeatures → ThreadFeature
│   ├── splitBodyFeatures → SplitBodyFeatures
│   └── moveFeatures → MoveFeatures
│
├── bRepBodies → BRepBodies → BRepBody
│   ├── faces → BRepFaces → BRepFace
│   ├── edges → BRepEdges → BRepEdge
│   ├── vertices → BRepVertices → BRepVertex
│   └── physicalProperties → PhysicalProperties
│
├── occurrences → OccurrenceList → Occurrence
│   └── component → Component (nested)
│
├── constructionPlanes → ConstructionPlanes → ConstructionPlane
├── constructionAxes → ConstructionAxes → ConstructionAxis
├── constructionPoints → ConstructionPoints → ConstructionPoint
│
├── xYConstructionPlane → ConstructionPlane
├── xZConstructionPlane → ConstructionPlane
├── yZConstructionPlane → ConstructionPlane
├── xConstructionAxis → ConstructionAxis
├── yConstructionAxis → ConstructionAxis
├── zConstructionAxis → ConstructionAxis
└── originConstructionPoint → ConstructionPoint
```

## Key Namespaces

| Namespace     | Contains                                                                 |
| ------------- | ------------------------------------------------------------------------ |
| `adsk.core`   | Application, Point3D, Vector3D, ValueInput, ObjectCollection, UI objects |
| `adsk.fusion` | Design, Component, Sketch, Features, BRep geometry, Parameters           |
| `adsk.cam`    | CAM, Setups, Operations, Tools                                           |

## Common Casting Pattern

Many properties return a base type that needs casting:

```python
# activeProduct returns Product base class — cast to Design
design = adsk.fusion.Design.cast(app.activeProduct)

# feature.bodies returns generic — items are BRepBody
body = feature.bodies.item(0)
```

## Collection Access Patterns

All collections support:

```python
collection.count          # Number of items
collection.item(index)    # Get by 0-based index
collection.itemByName(n)  # Get by name (if supported)
collection.itemById(id)   # Get by ID (if supported)
len(collection)           # Python len() works
for item in collection:   # Python iteration works
    pass
```

## Creation Pattern

Complex objects follow the Input → Add pattern:

```python
# 1. Get the feature collection
extrudes = rootComp.features.extrudeFeatures

# 2. Create an input object (like filling a dialog)
extInput = extrudes.createInput(profile, operation)

# 3. Set options on the input
extInput.setDistanceExtent(False, distance)

# 4. Call add() to create the feature
ext = extrudes.add(extInput)
```

## Edit Pattern

Existing features use Definition objects:

```python
ext = extrudes.item(0)
defn = ext.extentDefinition  # Get current definition
# Properties return Parameter objects (read-only value + expression)
```
