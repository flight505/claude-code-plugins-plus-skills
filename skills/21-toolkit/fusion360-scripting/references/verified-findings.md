# Verified Findings

Results from diagnostic scripts run in Fusion 360. These override documentation
and training data when they conflict.

## SweepFeatureInput.distanceOne has NO effect on Cut operations (verified 2026-04-03)

**Test**: Created 50mm box. Full groove sweep Cut with `distanceOne=0.9` (expected groove to stop at 45mm).
**Result**: Bounding box after sweep: `X=[0.00, 50.00]mm`. Groove cut the full 50mm.
**Conclusion**: `distanceOne` does not control the extent of a Cut sweep. The documentation says
it's "a value from 0 to 1 indicating the position along the path" but for CutFeatureOperation
it has no effect. Use full sweep + fill-back (extrude-Join) to shorten a groove.

## Fill-back extrude-Join works to shorten a groove (verified 2026-04-03)

**Test**: After full groove sweep, created a construction plane at 90% of path (45mm).
Drew the groove cross-section on that plane. Extruded Join, Positive direction, 5mm distance.
**Result**: Fill succeeded (health=0). Point containment at X=47.5mm = 0 (inside body).
The groove channel between 45mm and 50mm was filled back with solid material.
**Conclusion**: To shorten a groove, do full sweep Cut then extrude-Join from a plane at
the desired stop position. Direction: Positive fills toward path end, Negative fills toward start.

## Fill-back direction conventions (verified 2026-04-03)

**Test**: Construction plane from `setByDistanceOnPath` on a horizontal path.
**Result**: Plane normal = path tangent (confirmed: `normal=(1,0,0)` for +X path).
PositiveExtentDirection = along path tangent (toward path end).
NegativeExtentDirection = against path tangent (toward path start).
**Conclusion**: For fill-back at path end: Positive direction from a plane inside the path.
For fill-back at path start: Negative direction from a plane inside the path.

## ConstructionPlane from setByDistanceOnPath: normal = path tangent (verified 2026-04-03)

**Test**: `setByDistanceOnPath(path, 0.0)` on a 50mm horizontal line along +X.
**Result**: `origin=(0.00, 1.00, 0.00)`, `normal=(1.00, 0.00, 0.00)`.
**Conclusion**: The plane is perpendicular to the path at the specified position.
Its normal vector is the path tangent at that point. For a straight +X line,
normal = (+1, 0, 0). Extrude Positive = along +X. Extrude Negative = along -X.

## Tongue trim-cut (extrude-Cut from trim plane) works for Join sweeps (verified 2026-04-02)

**Test**: Full tongue sweep (Join), then extrude-Cut from a construction plane near the path start.
**Result**: Start trim cut succeeded (log: "Trim START: cut succeeded").
Tongue body has visible gap at the start. End trim varies — see below.
**Conclusion**: To shorten a tongue (Join sweep), do full sweep then extrude-Cut from a plane
at the desired trim position. Works because the Cut removes material that the Join already added.

## Tongue end trim direction issue (verified 2026-04-02)

**Test**: Trim plane at 99.6% of path (0.2mm from end). Extrude-Cut Positive direction, 1.3mm distance.
**Result**: Failed with "No target body" on some paths. Succeeded on others.
**Conclusion**: At the very end of the path, the Positive direction may point into empty space
(past the body). Using distance mode (not through-all) with an oversized profile (1.5x) and
150% distance margin helps. The DistanceExtentDefinition approach is more reliable than
ThroughAllExtentDefinition for end trims.

## AllExtentDefinition.create() does not exist (verified 2026-04-01)

**Test**: Called `adsk.fusion.AllExtentDefinition.create()`.
**Result**: `AttributeError: type object 'AllExtentDefinition' has no attribute 'create'`.
**Conclusion**: Use `ThroughAllExtentDefinition.create()` for one-sided through-all extrude.
Use `ext_input.setAllExtent(SymmetricExtentDirection)` for both-sides through-all.
AllExtentDefinition is only for hole features.

## CurveEvaluator3D.parametricRange() does not exist (verified 2026-04-01)

**Test**: Called `ev.parametricRange()` on a CurveEvaluator3D.
**Result**: `AttributeError: 'CurveEvaluator3D' object has no attribute 'parametricRange'`.
**Conclusion**: Use `ev.getParameterExtents()` which returns `(bool, startParam, endParam)`.
`parametricRange()` exists only on SurfaceEvaluator, not CurveEvaluator3D.

## SWIG: ObjectCollection vs plain list (verified 2026-04-01)

**Test**: Passed `ObjectCollection` to `createOffsetInput(curves, offset)`.
**Result**: `TypeError: argument 2 of type 'std::vector<Ptr<SketchCurve>>'`.
**Conclusion**: When the Python stub type hint says `list[SomeType]`, pass a plain Python list.
ObjectCollection is only for parameters typed as `ObjectCollection`. Check the stub signature.
Applies to: `participantBodies`, `createOffsetInput` curves, and others.

## setOneSideToExtent(body) fails when profile is in a void (verified 2026-04-03)

**Test**: After groove sweep cut, tried `setOneSideToExtent(groove_body, False)` from a
profile inside the groove channel.
**Result**: `EXTRUDE_CREATION_FAIL_ERROR - profile falls outside the boundary of the selected body`.
**Conclusion**: `setOneSideToExtent` requires the profile to be on or inside the target body's
solid material. If the profile is in a void (cut-away region), it fails. Use
`DistanceExtentDefinition` with exact distance instead.

## setOneSideToExtent(plane) fails with oversized profiles (verified 2026-04-03)

**Test**: Tongue trim with 1.5x oversized profile, `setOneSideToExtent(target_plane, True)`.
**Result**: Same error — profile falls outside body boundary.
**Conclusion**: The oversized profile extends past the tongue body. `setOneSideToExtent` checks
that the profile is within the target body/plane intersection. Use distance-based extent.

## Groove fill with inverted profile: no material above face (verified 2026-04-03)

**Test**: Full groove sweep Cut, then fill-back with Join using inverted height profile
(rectangle extends into body, opposite to face normal). Exact gap distance, no margin.
**Result**: Fill health=0. Groove body Z stayed at `[-10.0, 0.0]mm` (no upward extension).
Point containment at X=2.5mm Z=-1.5mm = 0 (groove filled). X=25mm still in groove channel.
**Conclusion**: Groove fill profiles MUST use inverted height. Normal height extends above the
face surface, creating unwanted material. Use `_draw_rect(..., invert_height=True)`.

## Tongue trim with exact distance works (verified 2026-04-03)

**Test**: Full tongue sweep Join, then extrude-Cut from plane at frac=0.14 (7mm), Negative
direction, exact 7mm distance. Profile 1.5x oversized.
**Result**: Trim health=0. Point containment at X=3.5mm Z=1.5mm = 2 (trimmed). X=10mm = 0 (intact).
**Conclusion**: Tongue trim works with exact gap distance. DistanceExtentDefinition with
NegativeExtentDirection toward path start. No margin needed — exact distance is clean.

## app.log('') crashes (verified 2026-04-03)

**Test**: Called `app.log('')` with an empty string.
**Result**: `RuntimeError: 2 : InternalValidationError : !message.empty()`.
**Conclusion**: Fusion's log method requires a non-empty string. Use `app.log(' ')` for blank lines.
