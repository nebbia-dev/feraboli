import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function DomeCoveringMono({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const coveringType = useMeasurementsStore((state: State) => state.coveringType.type);
    const domeWidth = useMeasurementsStore((state: State) => state.domeWidth);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const beamMaxHeight = useMeasurementsStore((state: State) => state.beamMaxHeight);
    const length = useMeasurementsStore((state: State) => state.length);
    const domeHeight = useMeasurementsStore((state: State) => state.domeHeight);
    const secondHeightOffset = useMeasurementsStore((state: State) => state.secondHeightOffset);

    const coveringRef = useRef<InstancedMesh|null>(null);
    const coveringGeometry = coveringType === 'L'
        ? baseModel?.domeCoveringLamLeft
        : coveringType === 'FC'
            ? baseModel?.domeCoveringFCLeft
            : baseModel?.domeCoveringLeft;
    const requiredValues = getDefinedValues({
        domeWidth,
        eavesHeight,
        roofInclineRad: roofIncline.rad,
        length,
        beamMaxHeight,
        domeHeight
    });

    if (
        !requiredValues
        || !coveringGeometry
    ) {
        return null;
    }

    const DOMECOVERINGLEFT = () => {
        const {domeWidth, length, roofInclineRad} = requiredValues;
        const activeCoveringLength = domeWidth / Math.cos(roofInclineRad);
        const xCount = coveringType === 'FC'
            ? Math.max(1, Math.floor(activeCoveringLength))
            : 1;
        const zCount = Math.floor(length) + 1;
        const count = xCount * zCount;

        useLayoutEffect(() => {
            if (!coveringRef.current) {
                return;
            }

            const {domeWidth, eavesHeight, roofInclineRad, beamMaxHeight, domeHeight} = requiredValues;
            const mesh = new THREE.Object3D();
            const ip = (domeWidth / 2) / Math.cos(roofInclineRad);
            const hToAdd = ip * Math.sin(roofInclineRad);
            coveringRef.current.geometry.computeBoundingBox();
            const shift = coveringRef.current.geometry.boundingBox!.min.x;
            coveringRef.current.geometry.translate(-shift, 0, 0);
            coveringRef.current.geometry.attributes.position.needsUpdate = true;

            for (let i = 0; i < count; i++) {
                const xIndex = i % xCount;
                const zIndex = Math.floor(i / xCount);

                mesh.scale.x = coveringType === 'FC'
                    ? 1
                    : activeCoveringLength;
                mesh.position.set(
                    domeWidth / 2,
                    eavesHeight
                        + secondHeightOffset
                        + beamMaxHeight
                        + domeHeight
                        + 0.25
                        + hToAdd,
                    -zIndex
                );
                mesh.rotation.set(0, Math.PI, -roofInclineRad);
                mesh.translateX(xIndex);
                mesh.updateMatrix();
                coveringRef.current.setMatrixAt(i, mesh.matrix);
            }

            coveringRef.current.instanceMatrix.needsUpdate = true;
        }, [activeCoveringLength, count, xCount]);

        return (
            <instancedUniformsMesh
                ref={coveringRef}
                args={[coveringGeometry, material, count]}>
            </instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <DOMECOVERINGLEFT/>
}
