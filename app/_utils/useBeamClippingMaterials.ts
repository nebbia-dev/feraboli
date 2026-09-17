import {useEffect, useLayoutEffect, useMemo} from "react";
import * as THREE from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export type BeamClippingGroup =
    | "primaryLeft"
    | "primaryRight"
    | "primaryBoth"
    | "outerLeft"
    | "outerRight";

export function useBeamClippingMaterials(material: THREE.Material) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const beamLength = useMeasurementsStore((state: State) => state.beamLength);
    const beamLeftLength = useMeasurementsStore((state: State) => state.beamLeftLength);
    const beamRightLength = useMeasurementsStore((state: State) => state.beamRightLength);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const secondRoofIncline = useMeasurementsStore((state: State) => state.secondRoofIncline);
    const interaxleWidth = useMeasurementsStore((state: State) => state.interaxleWidth);
    const secondHeight = useMeasurementsStore((state: State) => state.secondHeight);
    const secondHeightOffset = useMeasurementsStore((state: State) => state.secondHeightOffset);
    const overhangLeft = useMeasurementsStore((state: State) => state.overhangLeft);
    const overhangRight = useMeasurementsStore((state: State) => state.overhangRight);
    const beamBoundingBox = baseModel?.beamsLeft.boundingBox;

    const clipping = useMemo(() => {
        // Mantiene visibile il capitello sotto la faccia inferiore della trave.
        const primaryLeftPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
        const primaryRightPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
        const outerLeftPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
        const outerRightPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);

        const primaryLeftMaterial = material.clone();
        const primaryRightMaterial = material.clone();
        const primaryBothMaterial = material.clone();
        const outerLeftMaterial = material.clone();
        const outerRightMaterial = material.clone();

        primaryLeftMaterial.clippingPlanes = [primaryLeftPlane];
        primaryRightMaterial.clippingPlanes = [primaryRightPlane];
        // Sul pilastro centrale il capitello deve rimanere sotto entrambe
        // le facce inferiori delle travi che si incontrano al colmo.
        primaryBothMaterial.clippingPlanes = [
            primaryLeftPlane,
            primaryRightPlane
        ];
        outerLeftMaterial.clippingPlanes = [outerLeftPlane];
        outerRightMaterial.clippingPlanes = [outerRightPlane];

        return {
            primaryLeftPlane,
            primaryRightPlane,
            outerLeftPlane,
            outerRightPlane,
            materials: {
                primaryLeft: primaryLeftMaterial,
                primaryRight: primaryRightMaterial,
                primaryBoth: primaryBothMaterial,
                outerLeft: outerLeftMaterial,
                outerRight: outerRightMaterial,
            }
        };
    }, [material]);

    const hasDoubleHeight = secondHeight !== undefined
        && pillars !== undefined
        && pillars > 3
        && pitches === 'DH';
    const isShed = pillars === 3 && pitches === 'S';
    const isSingleBeamRoof = pillars !== undefined
        && pillars < 3
        && pitches?.includes('M');
    const primaryLeftBeamLength = hasDoubleHeight || isSingleBeamRoof
        ? beamLength
        : beamLeftLength;
    const primaryRightBeamLength = hasDoubleHeight || isSingleBeamRoof
        ? beamLength
        : beamRightLength;
    const primaryLeftRoofInclineRad = isShed
        ? secondRoofIncline.rad
        : roofIncline.rad;
    const primaryRoofValues = getDefinedValues({
        primaryLeftBeamLength,
        primaryRightBeamLength,
        eavesHeight,
        primaryLeftRoofInclineRad,
        roofInclineRad: roofIncline.rad,
        width,
        pillars,
        interaxleWidth,
        secondHeightOffset,
        overhangLeft,
        overhangRight,
        beamBoundingBox
    });
    const doubleHeightValues = hasDoubleHeight
        ? getDefinedValues({beamLeftLength, beamRightLength, overhangLeft, overhangRight})
        : undefined;
    const ready = Boolean(
        primaryRoofValues
        && (!hasDoubleHeight || doubleHeightValues)
    );

    useLayoutEffect(() => {
        if (!primaryRoofValues) return;
        if (hasDoubleHeight && !doubleHeightValues) return;

        const {
            primaryLeftBeamLength,
            primaryRightBeamLength,
            eavesHeight,
            primaryLeftRoofInclineRad,
            roofInclineRad,
            width,
            pillars,
            interaxleWidth,
            secondHeightOffset,
            overhangLeft,
            overhangRight,
            beamBoundingBox
        } = primaryRoofValues;
        const leftHeightOffset = (hasDoubleHeight ? 0 : Math.max(overhangRight - overhangLeft, 0))
            * Math.tan(roofInclineRad);
        const rightHeightOffset = (hasDoubleHeight ? 0 : Math.max(overhangLeft - overhangRight, 0))
            * Math.tan(roofInclineRad);
        const leftBeamPosition = hasDoubleHeight
            ? -(interaxleWidth / 2) - 0.5
            : -(width / 2) - overhangLeft;
        const rightBeamPosition = hasDoubleHeight
            ? (interaxleWidth / 2) + 0.5
            : (width / 2) + overhangRight;

        const leftBeamMatrix = new THREE.Matrix4().compose(
            new THREE.Vector3(
                leftBeamPosition,
                eavesHeight + leftHeightOffset + secondHeightOffset,
                0
            ),
            new THREE.Quaternion().setFromEuler(
                new THREE.Euler(
                    0,
                    Math.PI,
                    -primaryLeftRoofInclineRad
                )
            ),
            new THREE.Vector3(
                pillars < 3 && pitches?.includes("M")
                    ? primaryLeftBeamLength
                    : primaryLeftBeamLength + 1,
                1,
                1
            )
        );
        const rightBeamMatrix = pillars < 3 && pitches?.includes("M")
            ? leftBeamMatrix
            : new THREE.Matrix4().compose(
                new THREE.Vector3(
                    rightBeamPosition,
                    eavesHeight + rightHeightOffset + secondHeightOffset,
                    0
                ),
                new THREE.Quaternion().setFromEuler(
                    new THREE.Euler(0, 0, -roofInclineRad)
                ),
                new THREE.Vector3(primaryRightBeamLength + 1, 1, 1)
            );

        clipping.primaryLeftPlane
            .set(new THREE.Vector3(0, -1, 0), beamBoundingBox.min.y)
            .applyMatrix4(leftBeamMatrix);
        clipping.primaryRightPlane
            .set(new THREE.Vector3(0, -1, 0), beamBoundingBox.min.y)
            .applyMatrix4(rightBeamMatrix);

        if (hasDoubleHeight && doubleHeightValues) {
            const outerLeftHeightOffset = Math.max(
                doubleHeightValues.overhangRight - doubleHeightValues.overhangLeft,
                0
            ) * Math.tan(roofInclineRad);
            const outerRightHeightOffset = Math.max(
                doubleHeightValues.overhangLeft - doubleHeightValues.overhangRight,
                0
            ) * Math.tan(roofInclineRad);
            const outerLeftBeamMatrix = new THREE.Matrix4().compose(
                new THREE.Vector3(
                    -(width / 2) - doubleHeightValues.overhangLeft,
                    eavesHeight + outerLeftHeightOffset,
                    0
                ),
                new THREE.Quaternion().setFromEuler(
                    new THREE.Euler(0, Math.PI, -roofInclineRad)
                ),
                new THREE.Vector3(doubleHeightValues.beamLeftLength, 1, 1)
            );
            const outerRightBeamMatrix = new THREE.Matrix4().compose(
                new THREE.Vector3(
                    (width / 2) + doubleHeightValues.overhangRight,
                    eavesHeight + outerRightHeightOffset,
                    0
                ),
                new THREE.Quaternion().setFromEuler(
                    new THREE.Euler(0, 0, -roofInclineRad)
                ),
                new THREE.Vector3(doubleHeightValues.beamRightLength, 1, 1)
            );

            clipping.outerLeftPlane
                .set(new THREE.Vector3(0, -1, 0), beamBoundingBox.min.y)
                .applyMatrix4(outerLeftBeamMatrix);
            clipping.outerRightPlane
                .set(new THREE.Vector3(0, -1, 0), beamBoundingBox.min.y)
                .applyMatrix4(outerRightBeamMatrix);
        }
    }, [
        clipping,
        doubleHeightValues,
        hasDoubleHeight,
        pitches,
        primaryRoofValues
    ]);

    useEffect(() => {
        const clippedMaterials = Object.values(clipping.materials);

        return () => {
            clippedMaterials.forEach((clippedMaterial) => clippedMaterial.dispose());
        };
    }, [clipping]);

    return {
        ready,
        materials: clipping.materials
    };
}
