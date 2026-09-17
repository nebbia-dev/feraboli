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
    const coveringLength = useMeasurementsStore((state: State) => state.coveringLength);
    const coveringLeftLength = useMeasurementsStore((state: State) => state.coveringLeftLength);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
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
    const isDoubleHeight = pillars !== undefined && pillars > 3 && pitches === 'DH';
    const isShed = pillars === 3 && pitches === 'S';
    const activePrimaryCoveringLength = isDoubleHeight
        || (pillars !== undefined && pillars < 3 && pitches?.includes('M'))
            ? coveringLength
            : coveringLeftLength;
    const activeRoofInclineRad = isShed
        ? secondRoofIncline.rad
        : roofIncline.rad;
    const primaryRoofValues = getDefinedValues({
        activePrimaryCoveringLength,
        eavesHeight,
        activeRoofInclineRad,
        mainRoofInclineRad: roofIncline.rad,
        width,
        length,
        pillars,
        overhangRight,
        overhangLeft
    });
    const requiredValues = primaryRoofValues;

    if (
        !requiredValues
        || !coveringGeometry
    ) {
        return null;
    }

    const COVERINGLEFT = () => {
        const {length} = requiredValues;
        const activeCoveringLength = primaryRoofValues!.activePrimaryCoveringLength;
        const extendsToCenterClippingPlane = isShed
            || (primaryRoofValues!.pillars === 1 && pitches === 'D');
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
            const {overhangRight, overhangLeft} = requiredValues;
            const hoverhang = !isDoubleHeight && overhangLeft < overhangRight
                ? overhangRight - overhangLeft
                : 0;

            const mesh = new THREE.Object3D();
            const roofInclineRad = primaryRoofValues!.activeRoofInclineRad;

            const beamPosition = (interaxleWidth && primaryRoofValues!.pillars > 3 && pitches === 'DH')
                    ? -(interaxleWidth / 2) - 0.5
                    : -(primaryRoofValues!.width / 2) - overhangLeft;

            const hta = hoverhang * Math.tan(primaryRoofValues!.mainRoofInclineRad);

            const coveringHeight = primaryRoofValues!.eavesHeight + hta - purlinOffset + secondHeightOffset;
            coveringRef.current.geometry.computeBoundingBox();
            const shift = coveringRef.current.geometry.boundingBox!.max.x;
            coveringRef.current.geometry.translate(-shift, 0, 0);
            coveringRef.current.geometry.attributes.position.needsUpdate = true;

            for (let i = 0; i < count; i++) {
                const xIndex = i % xCount;
                const zIndex = Math.floor(i / xCount);

                mesh.scale.x = coveringType === 'FC'
                    ? Math.min(1, Math.max(renderedCoveringLength - xIndex, 0))
                    : renderedCoveringLength;
                mesh.position.set(beamPosition, coveringHeight, -zIndex);
                mesh.rotation.set(0, Math.PI, -roofInclineRad);
                mesh.translateX(-xIndex);
                mesh.updateMatrix();
                coveringRef.current.setMatrixAt(i, mesh.matrix);
            }

            coveringRef.current.instanceMatrix.needsUpdate = true;
        }, [count, renderedCoveringLength, xCount])

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
