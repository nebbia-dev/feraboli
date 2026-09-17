import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function TieBeamVert({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const beamLength = useMeasurementsStore((state: State) => state.beamLength);
    const beamLeftLength = useMeasurementsStore((state: State) => state.beamLeftLength);
    const beamRightLength = useMeasurementsStore((state: State) => state.beamRightLength);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const pillarsHeight = useMeasurementsStore((state: State) => state.pillarsHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);
    const secondRoofIncline = useMeasurementsStore((state: State) => state.secondRoofIncline);
    const interaxleWidth = useMeasurementsStore((state: State) => state.interaxleWidth);
    const secondHeight = useMeasurementsStore((state: State) => state.secondHeight);
    const secondHeightOffset = useMeasurementsStore((state: State) => state.secondHeightOffset);
    const overhangLeft = useMeasurementsStore((state: State) => state.overhangLeft);
    const overhangRight = useMeasurementsStore((state: State) => state.overhangRight);

    const primaryLeftRef = useRef<THREE.Mesh|null>(null);
    const primaryRightRef = useRef<THREE.Mesh|null>(null);
    const outerLeftRef = useRef<THREE.Mesh|null>(null);
    const outerRightRef = useRef<THREE.Mesh|null>(null);
    const beamGeometry = baseModel?.beamsLeft;

    const primaryPlaneLeft = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    const primaryPlaneRight = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    const outerPlaneLeft = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    const outerPlaneRight = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    const primaryMaterialLeft = material.clone();
    const primaryMaterialRight = material.clone();
    const outerMaterialLeft = material.clone();
    const outerMaterialRight = material.clone();
    primaryMaterialLeft.clippingPlanes = [primaryPlaneLeft];
    primaryMaterialRight.clippingPlanes = [primaryPlaneRight];
    outerMaterialLeft.clippingPlanes = [outerPlaneLeft];
    outerMaterialRight.clippingPlanes = [outerPlaneRight];

    const isDoubleHeight = pillars !== undefined && pillars > 3 && pitches === 'DH';
    const isShed = pillars === 3 && pitches === 'S';
    const isMono = pillars !== undefined && pillars < 3 && pitches?.includes('M');
    const primaryLeftBeamLength = isDoubleHeight || isMono
        ? beamLength
        : beamLeftLength;
    const primaryRightBeamLength = isDoubleHeight
        ? beamLength
        : isMono
            ? primaryLeftBeamLength
            : beamRightLength;
    const primaryLeftRoofInclineRad = isShed
        ? secondRoofIncline.rad
        : roofIncline.rad;
    const primaryRoofValues = getDefinedValues({
        primaryLeftBeamLength,
        primaryRightBeamLength,
        interaxleWidth,
        eavesHeight,
        roofInclineRad: roofIncline.rad,
        primaryLeftRoofInclineRad,
        pillarsHeight,
        width,
        length,
        interaxleLength,
        pillars,
        secondHeightOffset,
        overhangLeft,
        overhangRight,
        beamBoundingBox: beamGeometry?.boundingBox
    });
    const doubleHeightValues = secondHeight !== undefined
        ? getDefinedValues({beamLeftLength, beamRightLength, overhangLeft, overhangRight})
        : undefined;
    const requiredValues = primaryRoofValues;

    if (!requiredValues || (secondHeight !== undefined && !doubleHeightValues)) return null;

    const TIEBEAMVERT = () => {
        const {pillars, length, interaxleLength, interaxleWidth} = requiredValues;

        const tieBeamVertGeometry = new THREE.CylinderGeometry(0.01, 0.01,6, 6);
        const beamsPerPillars = 2 * (pillars - 1);
        const frames = (length / interaxleLength) + 1;
        const effBeams = frames * beamsPerPillars;
        const hasSecondHeight = secondHeight !== undefined;
        const primaryBeamsPerSide = hasSecondHeight ? frames : effBeams / 2;
        const outerBeamsPerSide = hasSecondHeight ? frames * (pillars - 2) : 0;

        useLayoutEffect(() => {
            if (!primaryLeftRef.current || !primaryRightRef.current) return;
            if (hasSecondHeight && (!outerLeftRef.current || !outerRightRef.current)) return;

            if (primaryRoofValues) {
                const {
                    primaryLeftBeamLength,
                    primaryRightBeamLength,
                    eavesHeight,
                    pillarsHeight,
                    roofInclineRad,
                    primaryLeftRoofInclineRad,
                    width,
                    interaxleLength,
                    pillars,
                    secondHeightOffset,
                    overhangLeft,
                    overhangRight,
                    beamBoundingBox
                } = primaryRoofValues;
                const mesh = new THREE.Object3D();
                let primaryLeftIndex = 0;
                let primaryRightIndex = 0;
                let outerLeftIndex = 0;
                let outerRightIndex = 0;

                const hasDoubleHeight = hasSecondHeight && pillars > 3;
                const leftBeamPosition = hasDoubleHeight
                    ? -(interaxleWidth / 2) - 0.5
                    : -(width / 2);
                const rightBeamPosition = hasDoubleHeight
                    ? (interaxleWidth / 2) + 0.5
                    : (width / 2);

                for (let i = 0; i < effBeams; i++) {
                    const localIndex = i % beamsPerPillars;
                    const pillarIndex = Math.floor(localIndex / 2);
                    const sideThreshold = beamsPerPillars / 2;
                    const isLeft = localIndex < sideThreshold;
                    const isCentral = localIndex === sideThreshold - 1 || localIndex === sideThreshold;
                    const xOffset = localIndex % 2 === 0
                        ? interaxleWidth / 3
                        : (interaxleWidth / 3) * 2;
                    const tieBeamPillarIndex = pitches === 'S' && pillars === 3
                        ? pillars - 1
                        : hasSecondHeight && isCentral
                            ? Math.floor(pillars / 2) - 1
                            : hasSecondHeight && !isLeft
                                ? pillars - 1
                                : 0;

                    mesh.position.set(
                        pillarsHeight[pillarIndex].position! + xOffset - (width / 2),
                        pillarsHeight[tieBeamPillarIndex].totalHeight! + 3,
                        -interaxleLength * Math.floor(i / beamsPerPillars)
                    );
                    mesh.updateMatrix();

                    if (hasSecondHeight && !isCentral && isLeft) {
                        (outerLeftRef.current as InstancedMesh).setMatrixAt(outerLeftIndex, mesh.matrix);
                        outerLeftIndex++;
                    } else if (hasSecondHeight && !isCentral) {
                        (outerRightRef.current as InstancedMesh).setMatrixAt(outerRightIndex, mesh.matrix);
                        outerRightIndex++;
                    } else if (isLeft) {
                        (primaryLeftRef.current as InstancedMesh).setMatrixAt(primaryLeftIndex, mesh.matrix);
                        primaryLeftIndex++;
                    } else {
                        (primaryRightRef.current as InstancedMesh).setMatrixAt(primaryRightIndex, mesh.matrix);
                        primaryRightIndex++;
                    }
                }

                const leftHeightOffset = !isDoubleHeight
                    ? Math.max(overhangRight - overhangLeft, 0) * Math.tan(roofInclineRad)
                    : 0;
                const rightHeightOffset = !isDoubleHeight
                    ? Math.max(overhangLeft - overhangRight, 0) * Math.tan(roofInclineRad)
                    : 0;
                const leftBeamMatrix = new THREE.Matrix4().compose(
                    new THREE.Vector3(
                        isDoubleHeight
                            ? leftBeamPosition
                            : -(width / 2) - overhangLeft,
                        eavesHeight + secondHeightOffset + leftHeightOffset,
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
                        isMono
                            ? primaryLeftBeamLength
                            : primaryLeftBeamLength + 1,
                        1,
                        1
                    )
                );
                const rightBeamMatrix = isMono
                    ? leftBeamMatrix
                    : new THREE.Matrix4().compose(
                        new THREE.Vector3(
                            isDoubleHeight
                                ? rightBeamPosition
                                : (width / 2) + overhangRight,
                            eavesHeight + secondHeightOffset + rightHeightOffset,
                            0
                        ),
                        new THREE.Quaternion().setFromEuler(
                            new THREE.Euler(0, 0, -roofInclineRad)
                        ),
                        new THREE.Vector3(primaryRightBeamLength + 1, 1, 1)
                    );

                // Porta la faccia inferiore di ciascuna trave nello spazio mondo.
                primaryPlaneLeft
                    .set(new THREE.Vector3(0, -1, 0), beamBoundingBox.min.y)
                    .applyMatrix4(leftBeamMatrix);
                primaryPlaneRight
                    .set(new THREE.Vector3(0, -1, 0), beamBoundingBox.min.y)
                    .applyMatrix4(rightBeamMatrix);

                if (hasSecondHeight && doubleHeightValues) {
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

                    outerPlaneLeft
                        .set(new THREE.Vector3(0, -1, 0), beamBoundingBox.min.y)
                        .applyMatrix4(outerLeftBeamMatrix);
                    outerPlaneRight
                        .set(new THREE.Vector3(0, -1, 0), beamBoundingBox.min.y)
                        .applyMatrix4(outerRightBeamMatrix);
                }
            }
        }, [beamsPerPillars, effBeams, hasSecondHeight, interaxleWidth]);

        return (
            <>
                <instancedUniformsMesh ref={primaryLeftRef}
                                       args={[tieBeamVertGeometry, primaryMaterialLeft, primaryBeamsPerSide]}>
                </instancedUniformsMesh>
                <instancedUniformsMesh ref={primaryRightRef}
                                       args={[tieBeamVertGeometry, primaryMaterialRight, primaryBeamsPerSide]}>
                </instancedUniformsMesh>
                {hasSecondHeight &&
                    <>
                        <instancedUniformsMesh ref={outerLeftRef}
                                               args={[tieBeamVertGeometry, outerMaterialLeft, outerBeamsPerSide]}>
                        </instancedUniformsMesh>
                        <instancedUniformsMesh ref={outerRightRef}
                                               args={[tieBeamVertGeometry, outerMaterialRight, outerBeamsPerSide]}>
                        </instancedUniformsMesh>
                    </>
                }
            </>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <TIEBEAMVERT/>
}
