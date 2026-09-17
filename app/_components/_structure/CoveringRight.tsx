import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function CoveringRight({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const coveringType = useMeasurementsStore((state: State) => state.coveringType.type);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const coveringLength = useMeasurementsStore((state: State) => state.coveringLength);
    const coveringRightLength = useMeasurementsStore((state: State) => state.coveringRightLength);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const purlinType = useMeasurementsStore((state: State) => state.purlinType);
    const interaxleWidth = useMeasurementsStore((state: State) => state.interaxleWidth);
    const secondHeightOffset = useMeasurementsStore((state: State) => state.secondHeightOffset);
    const overhangRight = useMeasurementsStore((state: State) => state.overhangRight);
    const overhangLeft = useMeasurementsStore((state: State) => state.overhangLeft);

    const coveringRef = useRef<InstancedMesh|null>(null);
    const coveringGeometry = coveringType === 'L'
        ? baseModel?.coveringLamRight
        : coveringType === 'FC'
            ? baseModel?.coveringFCRight
            : baseModel?.coveringRight;
    const isDoubleHeight = pillars !== undefined && pillars > 3 && pitches === 'DH';
    const activeCoveringLength = isDoubleHeight ? coveringLength : coveringRightLength;

    const requiredValues = getDefinedValues({
        activeCoveringLength,
        eavesHeight,
        roofInclineRad: roofIncline.rad,
        width,
        length,
        pillars,
        overhangRight,
        overhangLeft
    });

    if (
        !requiredValues
        || !coveringGeometry
        || (requiredValues.pillars < 3 && pitches?.includes('M'))
    ) {
        return null;
    }

    const COVERINGRIGHT = () => {
        const {length, activeCoveringLength} = requiredValues;
        const extendsToCenterClippingPlane = requiredValues.pillars === 1
            && pitches === 'D';
        const renderedCoveringLength = extendsToCenterClippingPlane
            ? activeCoveringLength + 1
            : activeCoveringLength;
        const xCount = coveringType === 'FC'
            ? Math.max(1, Math.ceil(renderedCoveringLength))
            : 1;
        const zCount = Math.floor(length) + 1;
        const count = xCount * zCount;

        useLayoutEffect(() => {
            const purlinOffset = purlinType === 'light' ? 0.18 : 0;
            if (!coveringRef.current) {
                return;
            }

            const {eavesHeight, roofInclineRad, width, pillars, overhangRight, overhangLeft} = requiredValues;
            const hoverhang = !isDoubleHeight && overhangLeft > overhangRight
                ? overhangLeft - overhangRight
                : 0;

            const mesh = new THREE.Object3D();
            const beamPosition = (interaxleWidth && pillars > 3 && pitches === 'DH')
                ? (interaxleWidth / 2) + 0.5
                : (width / 2) + overhangRight;
            const hta = hoverhang * Math.tan(roofInclineRad);

            coveringRef.current.geometry.computeBoundingBox();
            const shift = coveringRef.current.geometry.boundingBox!.min.x;
            coveringRef.current.geometry.translate(-shift, 0, 0);
            coveringRef.current.geometry.attributes.position.needsUpdate = true;

            for (let i = 0; i < count; i++) {
                const xIndex = i % xCount;
                const zIndex = Math.floor(i / xCount);

                mesh.scale.x = coveringType === 'FC'
                    ? Math.min(1, Math.max(renderedCoveringLength - xIndex, 0))
                    : renderedCoveringLength;
                mesh.position.set(
                    beamPosition,
                    eavesHeight + hta - purlinOffset + secondHeightOffset,
                    -zIndex
                );
                mesh.rotation.set(0, Math.PI, roofInclineRad);
                mesh.translateX(xIndex);
                mesh.updateMatrix();
                coveringRef.current.setMatrixAt(i, mesh.matrix);
            }

            coveringRef.current.instanceMatrix.needsUpdate = true;
        }, [count, renderedCoveringLength, xCount])

        return (
            <instancedUniformsMesh ref={coveringRef}
                                   args={[coveringGeometry, material, count]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <COVERINGRIGHT/>
}
