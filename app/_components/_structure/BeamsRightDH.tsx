import React, {useEffect, useLayoutEffect, useMemo, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default  function BeamsRightDH({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const beamRightLength = useMeasurementsStore((state: State) => state.beamRightLength);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);
    const pillarsHeight = useMeasurementsStore((state: State) => state.pillarsHeight);
    const overhangLeft = useMeasurementsStore((state: State) => state.overhangLeft);
    const overhangRight = useMeasurementsStore((state: State) => state.overhangRight);

    const ref = useRef<THREE.Mesh|null>(null);
    const beamGeometry = baseModel?.beamsRight;
    const clipping = useMemo(() => {
        const plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
        const clippedMaterial = material.clone();
        clippedMaterial.clippingPlanes = [plane];

        return {
            material: clippedMaterial,
            plane
        };
    }, [material]);
    const requiredValues = getDefinedValues({
        beamRightLength,
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
        if (!requiredValues) return;

        const pillarIndex = Math.floor(requiredValues.pillars / 2);
        const pillarPosition = requiredValues.pillarsHeight[pillarIndex].position;
        if (pillarPosition === undefined) return;

        clipping.plane.setFromNormalAndCoplanarPoint(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(pillarPosition + 0.095 - requiredValues.width / 2, 0, 0)
        );
    }, [clipping, requiredValues]);

    useEffect(() => () => {
        clipping.material.dispose();
    }, [clipping]);

    if (!requiredValues || (requiredValues.pillars < 3 && pitches?.includes('M'))) {
        return null;
    }

    const BEAMSRIGHT = () => {
        useLayoutEffect(() => {
            if (!ref.current) return;

            const {beamRightLength, eavesHeight, roofInclineRad, width, length, interaxleLength, overhangLeft, overhangRight} = requiredValues;
            const mesh = new THREE.Object3D();
            const heightOffset = Math.max(overhangLeft - overhangRight, 0)
                * Math.tan(roofInclineRad);

            for (let i = 0; i < (length / interaxleLength) + 1; i++) {
                mesh.scale.x = beamRightLength;
                const shift = ref.current.geometry.boundingBox!.max.x;
                ref.current.geometry.translate(-shift, 0, 0);
                mesh.position.set(
                    (width / 2) + overhangRight,
                    eavesHeight + heightOffset,
                    -interaxleLength * i
                );
                mesh.rotation.set(0, 0, -roofInclineRad);
                ref.current.geometry.attributes.position.needsUpdate = true;
                mesh.updateMatrix();
                (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
            }
        }, []);

        return (
            <instancedUniformsMesh ref={ref}
                                   args={[beamGeometry, clipping.material, (requiredValues.length / requiredValues.interaxleLength) + 1]}>
            </instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <BEAMSRIGHT/>
}
