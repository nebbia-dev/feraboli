import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function CoveringLeft({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const coveringType = useMeasurementsStore((state: State) => state.coveringType.type);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const coveringLeftLength = useMeasurementsStore((state: State) => state.coveringLeftLength);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const secondCoveringLength = useMeasurementsStore((state: State) => state.secondCoveringLength);
    const secondRoofIncline = useMeasurementsStore((state: State) => state.secondRoofIncline);
    const purlinType = useMeasurementsStore((state: State) => state.purlinType);
    const interaxleWidth = useMeasurementsStore((state: State) => state.interaxleWidth);
    const secondHeightOffset = useMeasurementsStore((state: State) => state.secondHeightOffset);
    const overhangLeft = useMeasurementsStore((state: State) => state.overhangLeft);
    const overhangRight = useMeasurementsStore((state: State) => state.overhangRight);

    const coveringRef = useRef<InstancedMesh|null>(null);
    const coveringGeometry = coveringType === 'L'
        ? baseModel?.coveringLamLeft
        : coveringType === 'FC'
            ? baseModel?.coveringFCLeft
            : baseModel?.coveringLeft;
    const secondRoofValues = getDefinedValues({
        secondCoveringLength,
        eavesHeight,
        secondRoofInclineRad: secondRoofIncline.rad,
        width,
        length,
        overhangRight,
        overhangLeft
    });
    const primaryRoofValues = getDefinedValues({
        coveringLeftLength,
        eavesHeight,
        roofInclineRad: roofIncline.rad,
        width,
        length,
        pillars,
        overhangRight,
        overhangLeft
    });
    const requiredValues = secondRoofValues ?? primaryRoofValues;

    if (
        !requiredValues
        || !coveringGeometry
    ) {
        return null;
    }

    const COVERINGLEFT = () => {
        const {length} = requiredValues;
        const activeCoveringLength = secondRoofValues
            ? secondRoofValues.secondCoveringLength
            : primaryRoofValues!.coveringLeftLength;
        const xCount = coveringType === 'FC'
            ? Math.max(1, Math.floor(activeCoveringLength))
            : 1;
        const zCount = Math.floor(length) + 1;
        const count = xCount * zCount;

        useLayoutEffect(() => {
            const purlinOffset = purlinType === 'light' ? 0.18 : 0;
            if (!coveringRef.current) {
                return;
            }
            const {overhangRight, overhangLeft} = requiredValues;
            const hoverhang = overhangLeft < overhangRight ?  (overhangRight - overhangLeft) : 0;

            const mesh = new THREE.Object3D();
            const roofInclineRad = secondRoofValues
                ? secondRoofValues.secondRoofInclineRad
                : primaryRoofValues!.roofInclineRad;

            const beamPosition = secondRoofValues
                ? -(secondRoofValues.width / 2)
                : (interaxleWidth && primaryRoofValues!.pillars > 3 && pitches === 'DH')
                    ? -(interaxleWidth / 2) - 0.5
                    : -(primaryRoofValues!.width / 2) - overhangLeft;

            const hta = hoverhang * Math.tan(roofInclineRad);

            const coveringHeight = secondRoofValues
                ? secondRoofValues.eavesHeight - purlinOffset
                : primaryRoofValues!.eavesHeight + hta - purlinOffset + secondHeightOffset;
            coveringRef.current.geometry.computeBoundingBox();
            const shift = coveringRef.current.geometry.boundingBox!.max.x;
            coveringRef.current.geometry.translate(-shift, 0, 0);
            coveringRef.current.geometry.attributes.position.needsUpdate = true;

            for (let i = 0; i < count; i++) {
                const xIndex = i % xCount;
                const zIndex = Math.floor(i / xCount);

                mesh.scale.x = coveringType === 'FC'
                    ? 1
                    : !secondRoofValues
                        && primaryRoofValues!.pillars === 1
                        && pitches === 'D'
                            ? activeCoveringLength + 1
                            : activeCoveringLength;
                mesh.position.set(beamPosition, coveringHeight, -zIndex);
                mesh.rotation.set(0, Math.PI, -roofInclineRad);
                mesh.translateX(-xIndex);
                mesh.updateMatrix();
                coveringRef.current.setMatrixAt(i, mesh.matrix);
            }

            coveringRef.current.instanceMatrix.needsUpdate = true;
        }, [activeCoveringLength, count, xCount])

        return (
            <instancedUniformsMesh
                ref={coveringRef}
                args={[coveringGeometry, material, count]}>
            </instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <COVERINGLEFT/>
}
