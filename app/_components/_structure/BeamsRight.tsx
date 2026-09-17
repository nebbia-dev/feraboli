import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default  function BeamsRight({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const beamLength = useMeasurementsStore((state: State) => state.beamLength);
    const beamRightLength = useMeasurementsStore((state: State) => state.beamRightLength);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);
    const interaxleWidth = useMeasurementsStore((state: State) => state.interaxleWidth);
    const secondHeightOffset = useMeasurementsStore((state: State) => state.secondHeightOffset);
    const overhangRight = useMeasurementsStore((state: State) => state.overhangRight);
    const overhangLeft = useMeasurementsStore((state: State) => state.overhangLeft);

    const ref = useRef<THREE.Mesh|null>(null);
    const beamGeometry = baseModel?.beamsRight;
    const isDoubleHeight = pillars !== undefined && pillars > 3 && pitches === 'DH';
    const activeBeamLength = isDoubleHeight ? beamLength : beamRightLength;
    const requiredValues = getDefinedValues({
        activeBeamLength,
        eavesHeight,
        roofInclineRad: roofIncline.rad,
        width,
        length,
        interaxleLength,
        pillars,
        overhangRight,
        overhangLeft
    });

    if (!requiredValues || (requiredValues.pillars < 3 && pitches?.includes('M'))) {
        return null;
    }

    const BEAMSRIGHT = () => {
        useLayoutEffect(() => {
            if (!ref.current) return;

            const {activeBeamLength, eavesHeight, roofInclineRad, width, length, interaxleLength, pillars, overhangRight, overhangLeft} = requiredValues;
            const hoverhang = !isDoubleHeight && overhangLeft > overhangRight
                ? overhangLeft - overhangRight
                : 0;
            const hta = hoverhang * Math.tan(roofInclineRad);
            const mesh = new THREE.Object3D();
            const beamPosition = (interaxleWidth && pillars > 3 && pitches === 'DH')
                                            ? (interaxleWidth / 2) + 0.5
                                            : (width / 2) + overhangRight

            for (let i = 0; i < (length / interaxleLength) + 1; i++) {
                mesh.scale.x = activeBeamLength + 1;
                const shift = ref.current.geometry.boundingBox!.max.x;
                ref.current.geometry.translate(-shift, 0, 0);
                mesh.position.set(beamPosition, eavesHeight + hta + secondHeightOffset, -interaxleLength * i);
                mesh.rotation.set(0, 0, -roofInclineRad);
                ref.current.geometry.attributes.position.needsUpdate = true;
                mesh.updateMatrix();
                (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
            }
        }, []);

        return (
            <instancedUniformsMesh ref={ref}
                                   args={[beamGeometry, material, (requiredValues.length / requiredValues.interaxleLength) + 1]}>
            </instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <BEAMSRIGHT/>
}
