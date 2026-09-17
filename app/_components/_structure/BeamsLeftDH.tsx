import React, {useEffect, useLayoutEffect, useMemo, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function BeamsLeftDH({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const beamLeftLength = useMeasurementsStore((state: State) => state.beamLeftLength);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);
    const pillarsHeight = useMeasurementsStore((state: State) => state.pillarsHeight);
    const overhangLeft = useMeasurementsStore((state: State) => state.overhangLeft);
    const overhangRight = useMeasurementsStore((state: State) => state.overhangRight);

    const ref = useRef<THREE.Mesh|null>(null);
    const beamGeometry = baseModel?.beamsLeft;
    const clipping = useMemo(() => {
        const plane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
        const clippedMaterial = material.clone();
        clippedMaterial.clippingPlanes = [plane];

        return {
            material: clippedMaterial,
            plane
        };
    }, [material]);
    const roofValues = getDefinedValues({
        beamLeftLength,
        eavesHeight,
        roofInclineRad: roofIncline.rad,
        width,
        length,
        interaxleLength,
        pillars,
        pillarsHeight,
        overhangLeft,
        overhangRight
    });

    useLayoutEffect(() => {
        if (!roofValues) return;

        const pillarIndex = Math.ceil(roofValues.pillars / 2) - 1;
        const pillarPosition = roofValues.pillarsHeight[pillarIndex].position;
        if (pillarPosition === undefined) return;

        clipping.plane.setFromNormalAndCoplanarPoint(
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(pillarPosition - 0.095 - roofValues.width / 2, 0, 0)
        );
    }, [clipping, roofValues]);

    useEffect(() => () => {
        clipping.material.dispose();
    }, [clipping]);

    if (!roofValues) return null;

    const BEAMSLEFT = () => {
        const {length, interaxleLength} = roofValues;

        useLayoutEffect(() => {
            if (!ref.current) return;

            if (roofValues) {
                const {beamLeftLength, eavesHeight, roofInclineRad, width, length, interaxleLength, overhangLeft, overhangRight} = roofValues;
                const mesh = new THREE.Object3D();
                const heightOffset = Math.max(overhangRight - overhangLeft, 0)
                    * Math.tan(roofInclineRad);

                for (let i = 0; i < (length / interaxleLength) + 1; i++) {
                    mesh.scale.x = beamLeftLength;
                    const shift = ref.current.geometry.boundingBox!.max.x;
                    ref.current.geometry.translate(-shift, 0, 0);
                    mesh.position.set(
                        -(width / 2) - overhangLeft,
                        eavesHeight + heightOffset,
                        i === 0 ? 0 : -interaxleLength * i
                    );
                    mesh.rotation.set(0, Math.PI, -roofInclineRad);
                    ref.current.geometry.attributes.position.needsUpdate = true;
                    mesh.updateMatrix();
                    (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
                }
            }
        }, []);

        return (
            <instancedUniformsMesh ref={ref}
                                   args={[beamGeometry, clipping.material, (length / interaxleLength) + 1]}>
            </instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <BEAMSLEFT/>
}
