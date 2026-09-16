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

    const requiredValues = getDefinedValues({
        coveringRightLength,
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
        const {length, coveringRightLength} = requiredValues;
        const xCount = coveringType === 'FC'
            ? Math.max(1, Math.floor(coveringRightLength))
            : 1;
        const zCount = Math.floor(length) + 1;
        const count = xCount * zCount;

        useLayoutEffect(() => {
            const purlinOffset = purlinType === 'light' ? 0.18 : 0;
            if (!coveringRef.current) {
                return;
            }

            const {coveringRightLength, eavesHeight, roofInclineRad, width, pillars, overhangRight, overhangLeft} = requiredValues;
            const hoverhang = overhangLeft > overhangRight ? (overhangLeft - overhangRight) : 0;

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

                mesh.scale.x = pillars === 1 && pitches === 'D'
                    ? coveringRightLength + 1
                    : coveringType === 'FC'
                        ? 1
                        : coveringRightLength;
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
        }, [count, xCount])

        return (
            <instancedUniformsMesh ref={coveringRef}
                                   args={[coveringGeometry, material, count]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <COVERINGRIGHT/>
}
