import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function BeamsLeft({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const beamLength = useMeasurementsStore((state: State) => state.beamLength);
    const beamLeftLength = useMeasurementsStore((state: State) => state.beamLeftLength);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);
    const secondRoofIncline = useMeasurementsStore((state: State) => state.secondRoofIncline);
    const interaxleWidth = useMeasurementsStore((state: State) => state.interaxleWidth);
    const secondHeightOffset = useMeasurementsStore((state: State) => state.secondHeightOffset);
    const overhangRight = useMeasurementsStore((state: State) => state.overhangRight);
    const overhangLeft = useMeasurementsStore((state: State) => state.overhangLeft);

    const ref = useRef<THREE.Mesh|null>(null);
    const beamGeometry = baseModel?.beamsLeft;
    const isDoubleHeight = pillars !== undefined && pillars > 3 && pitches === 'DH';
    const isShed = pillars === 3 && pitches === 'S';
    const activeBeamLength = isDoubleHeight
        || (pillars !== undefined && pillars < 3 && pitches?.includes('M'))
            ? beamLength
            : beamLeftLength;
    const activeRoofInclineRad = isShed
        ? secondRoofIncline.rad
        : roofIncline.rad;
    const primaryRoofValues = getDefinedValues({
        activeBeamLength,
        eavesHeight,
        activeRoofInclineRad,
        mainRoofInclineRad: roofIncline.rad,
        width,
        length,
        interaxleLength,
        pillars,
        overhangRight,
        overhangLeft
    });
    const requiredValues = primaryRoofValues;

    if (!requiredValues) return null;

    const BEAMSLEFT = () => {
        const {length, interaxleLength} = requiredValues;

        useLayoutEffect(() => {
            if (!ref.current) return;

            if (primaryRoofValues) {
                const {activeBeamLength, eavesHeight, activeRoofInclineRad, mainRoofInclineRad, width, length, interaxleLength, pillars, overhangRight, overhangLeft} = primaryRoofValues;
                const mesh = new THREE.Object3D();
                const hoverhang = !isDoubleHeight && overhangLeft < overhangRight
                    ? overhangRight - overhangLeft
                    : 0;
                const hta = hoverhang * Math.tan(mainRoofInclineRad);

                const beamPosition = (interaxleWidth && pillars > 3 && pitches === 'DH')
                    ? -(interaxleWidth / 2) - 0.5
                    : -(width / 2) - overhangLeft

                for (let i = 0; i < (length / interaxleLength) + 1; i++) {
                    mesh.scale.x = pillars < 3 && pitches?.includes('M')
                        ? activeBeamLength
                        : activeBeamLength + 1;
                    const shift = ref.current.geometry.boundingBox!.max.x;
                    ref.current.geometry.translate(-shift, 0, 0);
                    mesh.position.set(beamPosition, eavesHeight + hta + secondHeightOffset, i === 0 ? 0 : -interaxleLength * i);
                    mesh.rotation.set(0, Math.PI, -activeRoofInclineRad);
                    ref.current.geometry.attributes.position.needsUpdate = true;
                    mesh.updateMatrix();
                    (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
                }
            }
        }, []);

        return (
            <instancedUniformsMesh ref={ref}
                                   args={[beamGeometry, material, (length / interaxleLength) + 1]}>
            </instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <BEAMSLEFT/>
}
